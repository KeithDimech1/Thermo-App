#!/usr/bin/env python3
"""
Extract exact database schema from EarthBank templates.
Reads the "Field Definitions" sheets to get the technical database column names.
"""

import pandas as pd
import json
from pathlib import Path

def extract_schema_from_template(filepath: Path):
    """Extract database schema from Field Definitions sheets."""
    print(f"\n{'='*80}")
    print(f"File: {filepath.name}")
    print(f"{'='*80}\n")

    excel_file = pd.ExcelFile(filepath)
    schemas = {}

    # Find all "Field Definitions" sheets
    definition_sheets = [s for s in excel_file.sheet_names if s.startswith("Field Definitions")]

    for sheet_name in definition_sheets:
        df = pd.read_excel(filepath, sheet_name=sheet_name)

        # Extract table name from sheet name (e.g., "Field Definitions - FTDataPoint" -> "FTDataPoint")
        table_name = sheet_name.replace("Field Definitions - ", "")

        print(f"\n{table_name}")
        print("-" * 80)

        # Get technical database names
        if "Database Technical Name" in df.columns:
            fields = []
            for idx, row in df.iterrows():
                if pd.notna(row.get("Database Technical Name")):
                    field_info = {
                        "name": str(row["Database Technical Name"]),
                        "display_name": str(row.get("Field", "")),
                        "datatype": str(row.get("Datatype", "")),
                        "unit": str(row.get("Unit", "")),
                        "description": str(row.get("Description", ""))
                    }
                    fields.append(field_info)
                    print(f"  {len(fields):3d}. {field_info['name']:40s} {field_info['datatype']:15s} {field_info['unit']}")

            schemas[table_name] = fields
            print(f"\nTotal fields: {len(fields)}")
        else:
            print("  ⚠ No 'Database Technical Name' column found")

    return schemas

def main():
    templates_dir = Path("/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/archive/earthbanktemplates")
    output_file = Path("/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/assets/schemas/earthbank-schema-extracted.json")

    all_schemas = {}

    # Process each template
    for template in sorted(templates_dir.glob("*.xlsx")):
        try:
            schemas = extract_schema_from_template(template)
            template_name = template.stem  # Filename without extension
            all_schemas[template_name] = schemas
        except Exception as e:
            print(f"Error reading {template.name}: {e}")
            continue

    # Save to JSON
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w') as f:
        json.dump(all_schemas, f, indent=2)

    print(f"\n{'='*80}")
    print(f"Schema extracted and saved to: {output_file}")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()
