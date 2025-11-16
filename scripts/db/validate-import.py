#!/usr/bin/env python3
"""
Pre-import validation script

Validates CSV data against database schema BEFORE attempting import.
Catches all issues early - no failed imports, no data loss.

Usage:
    python validate-import.py <data-directory>
"""

import sys
import os
import pandas as pd
import psycopg2
from pathlib import Path
from dotenv import load_dotenv
from typing import Dict, List, Tuple

# Load environment
load_dotenv('/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/.env.local')

class ImportValidator:
    """Validates CSV data against database schema before import"""

    def __init__(self, db_url: str):
        self.db_url = db_url
        self.conn = psycopg2.connect(db_url)
        self.cur = self.conn.cursor()
        self.errors = []
        self.warnings = []

    def close(self):
        self.cur.close()
        self.conn.close()

    def get_table_schema(self, table_name: str) -> Dict[str, Dict]:
        """Get table schema from database"""
        self.cur.execute("""
            SELECT
                column_name,
                data_type,
                character_maximum_length,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = %s
            ORDER BY ordinal_position
        """, (table_name,))

        schema = {}
        for row in self.cur.fetchall():
            col_name, data_type, max_len, nullable, default = row
            schema[col_name] = {
                'type': data_type,
                'max_length': max_len,
                'nullable': nullable == 'YES',
                'has_default': default is not None
            }
        return schema

    def validate_dataframe(self, df: pd.DataFrame, table_name: str) -> Tuple[bool, List[str], List[str]]:
        """
        Validate DataFrame against table schema

        Returns:
            (is_valid, errors, warnings)
        """
        errors = []
        warnings = []

        # Get schema
        schema = self.get_table_schema(table_name)
        if not schema:
            errors.append(f"Table '{table_name}' not found in database")
            return False, errors, warnings

        # Check 1: Column existence
        df_cols = set(df.columns)
        schema_cols = set(schema.keys())

        # Required columns (not nullable, no default)
        required_cols = {
            col for col, info in schema.items()
            if not info['nullable'] and not info['has_default'] and col != 'id'
        }

        missing_required = required_cols - df_cols
        if missing_required:
            errors.append(f"Missing required columns: {missing_required}")

        extra_cols = df_cols - schema_cols - {'dataset_id'}  # dataset_id handled separately
        if extra_cols:
            warnings.append(f"Extra columns (will be ignored): {extra_cols}")

        # Check 2: Data types and constraints
        for col in df.columns:
            if col not in schema:
                continue

            col_schema = schema[col]

            # Check string length
            if col_schema['type'] == 'character varying' and col_schema['max_length']:
                max_len = df[col].astype(str).str.len().max()
                if pd.notna(max_len) and max_len > col_schema['max_length']:
                    longest_val = df[col].astype(str).loc[df[col].astype(str).str.len().idxmax()]
                    errors.append(
                        f"Column '{col}': value too long ({max_len} > {col_schema['max_length']})\n"
                        f"  Value: {longest_val[:100]}..."
                    )

            # Check nulls
            if not col_schema['nullable']:
                null_count = df[col].isna().sum()
                if null_count > 0:
                    errors.append(f"Column '{col}': {null_count} NULL values (not allowed)")

            # Check numeric ranges
            if col_schema['type'] in ('integer', 'numeric'):
                non_numeric = pd.to_numeric(df[col], errors='coerce').isna() & df[col].notna()
                if non_numeric.any():
                    bad_vals = df[col][non_numeric].head(3).tolist()
                    errors.append(f"Column '{col}': non-numeric values found: {bad_vals}")

        # Check 3: Data quality
        if 'sample_id' in df.columns:
            # Check for valid sample IDs (should match pattern)
            if table_name == 'samples':
                invalid_ids = df[~df['sample_id'].astype(str).str.match(r'^[A-Z]{2,4}\d{2}-\d{2,3}$', na=False)]
                if len(invalid_ids) > 0:
                    bad_ids = invalid_ids['sample_id'].head(5).tolist()
                    errors.append(f"Invalid sample_id format: {bad_ids}")

            # Check for duplicates
            dupes = df['sample_id'].duplicated().sum()
            if dupes > 0:
                errors.append(f"Duplicate sample_ids: {dupes} rows")

        # Check 4: Foreign keys
        if table_name in ('ft_ages', 'ft_counts', 'ft_track_lengths'):
            if 'sample_id' in df.columns:
                # Check all sample_ids exist in samples table
                sample_ids = df['sample_id'].unique()
                self.cur.execute("""
                    SELECT sample_id FROM samples WHERE sample_id = ANY(%s)
                """, (list(sample_ids),))
                existing = {row[0] for row in self.cur.fetchall()}
                missing = set(sample_ids) - existing
                if missing and table_name != 'samples':  # samples will be imported first
                    warnings.append(f"sample_ids not yet in database: {missing} (will be imported)")

        is_valid = len(errors) == 0
        return is_valid, errors, warnings

    def validate_csv(self, csv_path: Path, table_name: str) -> Tuple[bool, List[str], List[str]]:
        """Validate CSV file"""
        if not csv_path.exists():
            return False, [f"File not found: {csv_path}"], []

        try:
            df = pd.read_csv(csv_path)
        except Exception as e:
            return False, [f"Failed to read CSV: {e}"], []

        if len(df) == 0:
            return False, ["CSV file is empty"], []

        return self.validate_dataframe(df, table_name)


def validate_import_directory(data_dir: Path) -> bool:
    """
    Validate all CSV files in directory

    Returns:
        True if all valid, False otherwise
    """

    # Expected files
    files_to_validate = {
        'samples.csv': 'samples',
        'ft_ages.csv': 'ft_ages',
        'ft_counts.csv': 'ft_counts',
        'ft_track_lengths.csv': 'ft_track_lengths',
    }

    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found")
        return False

    validator = ImportValidator(DATABASE_URL)

    print('━' * 80)
    print('PRE-IMPORT VALIDATION')
    print('━' * 80)
    print()

    all_valid = True

    for csv_file, table_name in files_to_validate.items():
        # Find matching file
        matching_files = list(data_dir.glob(f'*{csv_file}'))

        if not matching_files:
            print(f'⚠️  {csv_file}: NOT FOUND')
            continue

        csv_path = matching_files[0]
        print(f'→ Validating {csv_path.name}...')

        is_valid, errors, warnings = validator.validate_csv(csv_path, table_name)

        if is_valid:
            # Count rows
            df = pd.read_csv(csv_path)
            print(f'  ✅ VALID ({len(df)} rows)')
        else:
            all_valid = False
            print(f'  ❌ INVALID')
            for error in errors:
                print(f'     ERROR: {error}')

        if warnings:
            for warning in warnings:
                print(f'     ⚠️  {warning}')

        print()

    validator.close()

    print('━' * 80)
    if all_valid:
        print('✅ ALL FILES VALID - READY FOR IMPORT')
    else:
        print('❌ VALIDATION FAILED - FIX ERRORS BEFORE IMPORT')
    print('━' * 80)

    return all_valid


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python validate-import.py <data-directory>")
        sys.exit(1)

    data_dir = Path(sys.argv[1])
    if not data_dir.exists():
        print(f"❌ Directory not found: {data_dir}")
        sys.exit(1)

    valid = validate_import_directory(data_dir)
    sys.exit(0 if valid else 1)
