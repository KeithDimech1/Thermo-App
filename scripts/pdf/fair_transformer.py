#!/usr/bin/env python3
"""
FAIR Schema Transformer

Purpose: Transform publication format → FAIR database schema
Author: Claude Code
Created: 2025-11-16

Features:
- Denormalize publication tables → Normalize database schema
- Add metadata fields from methods section
- Generate required IDs (grain_id, sample_mount_id, IGSN)
- Split combined tables into separate FAIR tables

Output tables:
- samples (1 record per sample)
- ft_ages (1 record per sample)
- ft_counts (n records per sample - grain-level data)
- ft_track_lengths (n records per sample - individual track measurements)
- ahe_grain_data (n records per sample - single grain (U-Th)/He ages)
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


class FAIRTransformer:
    """Transform extracted data to FAIR-compliant schema"""

    def __init__(self):
        """Initialize transformer"""
        pass

    def transform(
        self,
        extracted_tables: Dict[str, pd.DataFrame],
        metadata: Dict
    ) -> Dict[str, pd.DataFrame]:
        """
        Transform publication format → FAIR database format

        Args:
            extracted_tables: Dictionary of table_id → DataFrame (from extraction)
            metadata: Paper metadata (from methods section + DOI)

        Returns:
            Dictionary of FAIR table_name → DataFrame
        """
        logger.info("Transforming to FAIR schema...")

        fair_data = {}

        # Identify table types
        aft_tables = self._find_tables_by_type(extracted_tables, 'AFT_ages')
        ahe_tables = self._find_tables_by_type(extracted_tables, 'UThHe')
        count_tables = self._find_tables_by_type(extracted_tables, 'track_counts')
        length_tables = self._find_tables_by_type(extracted_tables, 'track_lengths')

        # 1. Create samples table (from all tables)
        if aft_tables or ahe_tables:
            fair_data['samples'] = self._create_samples_table(
                extracted_tables, metadata
            )
            logger.info(f"  ✓ samples: {len(fair_data['samples'])} records")

        # 2. Create ft_ages table (from AFT tables)
        if aft_tables:
            fair_data['ft_ages'] = self._create_ft_ages_table(
                aft_tables, metadata
            )
            logger.info(f"  ✓ ft_ages: {len(fair_data['ft_ages'])} records")

        # 3. Create ft_counts table (from AFT or count tables)
        if aft_tables or count_tables:
            fair_data['ft_counts'] = self._create_ft_counts_table(
                aft_tables if aft_tables else count_tables, metadata
            )
            logger.info(f"  ✓ ft_counts: {len(fair_data['ft_counts'])} records")

        # 4. Create ft_track_lengths table (from length tables)
        if length_tables:
            fair_data['ft_track_lengths'] = self._create_track_lengths_table(
                length_tables, metadata
            )
            logger.info(f"  ✓ ft_track_lengths: {len(fair_data['ft_track_lengths'])} records")

        # 5. Create ahe_grain_data table (from AHe tables)
        if ahe_tables:
            fair_data['ahe_grain_data'] = self._create_ahe_table(
                ahe_tables, metadata
            )
            logger.info(f"  ✓ ahe_grain_data: {len(fair_data['ahe_grain_data'])} records")

        return fair_data

    def _find_tables_by_type(
        self,
        tables: Dict[str, pd.DataFrame],
        table_type: str
    ) -> List[pd.DataFrame]:
        """Find all tables of a specific type"""
        # This is a simplified version - in reality, we'd track table types from semantic_analysis
        # For now, we'll use table IDs and content heuristics
        result = []
        for table_id, df in tables.items():
            # Heuristic: check if table contains type-specific columns
            if self._is_table_type(df, table_type):
                result.append(df)
        return result

    def _is_table_type(self, df: pd.DataFrame, table_type: str) -> bool:
        """Check if DataFrame is of a specific type"""
        columns_str = ' '.join([str(col).lower() for col in df.columns])

        type_patterns = {
            'AFT_ages': ['age', 'ma', 'dispersion', 'p(χ²)'],
            'UThHe': ['u', 'th', 'he', 'ft'],
            'track_counts': ['ns', 'ni', 'rho_s', 'rho_i'],
            'track_lengths': ['length', 'mtl']
        }

        patterns = type_patterns.get(table_type, [])
        return sum(1 for p in patterns if p in columns_str) >= 2

    def _create_samples_table(
        self,
        extracted_tables: Dict[str, pd.DataFrame],
        metadata: Dict
    ) -> pd.DataFrame:
        """
        Create samples table

        Required fields:
        - sample_id (PK)
        - igsn (unique)
        - dataset_id (FK)
        - latitude, longitude, elevation_m
        - lithology, mineral
        - description
        """
        samples = []

        # Get first AFT table (usually has sample metadata)
        for table_id, df in extracted_tables.items():
            if self._is_table_type(df, 'AFT_ages'):
                # Extract sample info from each row
                for idx, row in df.iterrows():
                    sample_id = self._extract_sample_id(row)
                    if not sample_id:
                        continue

                    sample = {
                        'sample_id': sample_id,
                        'igsn': self._generate_igsn(sample_id, metadata),
                        'dataset_id': metadata.get('dataset_id', 1),
                        'latitude': self._extract_field(row, ['lat', 'latitude']),
                        'longitude': self._extract_field(row, ['lon', 'long', 'longitude']),
                        'elevation_m': self._extract_field(row, ['elev', 'elevation', 'altitude']),
                        'lithology': self._extract_field(row, ['lith', 'lithology', 'rock']),
                        'mineral': metadata.get('mineral', 'apatite'),  # From methods or table
                        'description': f"Sample from {metadata.get('title', 'Unknown paper')}",
                    }

                    samples.append(sample)

                break  # Only process first AFT table

        return pd.DataFrame(samples)

    def _create_ft_ages_table(
        self,
        aft_tables: List[pd.DataFrame],
        metadata: Dict
    ) -> pd.DataFrame:
        """
        Create ft_ages table

        Required fields:
        - sample_id (FK)
        - central_age_ma, central_age_error_ma
        - pooled_age_ma, pooled_age_error_ma
        - n_grains, dispersion_pct, p_chi2_pct
        - zeta, zeta_error, dosimeter_glass
        """
        ages = []

        for df in aft_tables:
            for idx, row in df.iterrows():
                sample_id = self._extract_sample_id(row)
                if not sample_id:
                    continue

                age = {
                    'sample_id': sample_id,
                    'central_age_ma': self._extract_field(row, ['central age', 'age', 'ma']),
                    'central_age_error_ma': self._extract_field(row, ['±', 'error', '1σ']),
                    'pooled_age_ma': self._extract_field(row, ['pooled age']),
                    'pooled_age_error_ma': self._extract_field(row, ['pooled error']),
                    'n_grains': self._extract_field(row, ['n', 'grains', 'no. of grains']),
                    'dispersion_pct': self._extract_field(row, ['disp', 'dispersion']),
                    'p_chi2_pct': self._extract_field(row, ['p(χ²)', 'pχ2', 'p chi2']),
                    'zeta': metadata.get('zeta'),
                    'zeta_error': metadata.get('zeta_error'),
                    'dosimeter_glass': metadata.get('dosimeter'),
                }

                ages.append(age)

        return pd.DataFrame(ages)

    def _create_ft_counts_table(
        self,
        count_tables: List[pd.DataFrame],
        metadata: Dict
    ) -> pd.DataFrame:
        """
        Create ft_counts table (grain-level count data)

        Required fields:
        - grain_id (PK)
        - sample_id (FK)
        - Ns, Ni, Nd (track counts)
        - rho_s_cm2, rho_i_cm2, rho_d_cm2 (track densities)
        - U_ppm, Th_ppm, eU_ppm
        - Dpar_um (etch pit diameter)
        - analyst, laboratory, microscope
        """
        counts = []

        for df in count_tables:
            for idx, row in df.iterrows():
                sample_id = self._extract_sample_id(row)
                if not sample_id:
                    continue

                # Generate grain ID
                grain_num = idx + 1
                grain_id = f"{sample_id}_grain_{grain_num:02d}"

                count = {
                    'grain_id': grain_id,
                    'sample_id': sample_id,
                    'Ns': self._extract_field(row, ['ns']),
                    'Ni': self._extract_field(row, ['ni']),
                    'Nd': self._extract_field(row, ['nd']),
                    'rho_s_cm2': self._extract_field(row, ['ρs', 'rho_s', 'rhos']),
                    'rho_i_cm2': self._extract_field(row, ['ρi', 'rho_i', 'rhoi']),
                    'rho_d_cm2': self._extract_field(row, ['ρd', 'rho_d', 'rhod']),
                    'U_ppm': self._extract_field(row, ['u', '238u', 'uranium']),
                    'Th_ppm': self._extract_field(row, ['th', '232th', 'thorium']),
                    'eU_ppm': self._extract_field(row, ['eu', 'effective u']),
                    'Dpar_um': self._extract_field(row, ['dpar']),
                    # Metadata from methods section
                    'analyst': metadata.get('analyst'),
                    'laboratory': metadata.get('laboratory'),
                    'microscope': metadata.get('microscope'),
                    'objective': metadata.get('objective'),
                    'etching_conditions': metadata.get('etching_conditions'),
                    'dosimeter': metadata.get('dosimeter'),
                    'ft_algorithm': metadata.get('ft_algorithm'),
                    'ft_counting_method': metadata.get('ft_counting_method'),
                    'ft_software': metadata.get('ft_software'),
                }

                counts.append(count)

        return pd.DataFrame(counts)

    def _create_track_lengths_table(
        self,
        length_tables: List[pd.DataFrame],
        metadata: Dict
    ) -> pd.DataFrame:
        """
        Create ft_track_lengths table (individual track measurements)

        Required fields:
        - track_id (PK)
        - sample_id (FK)
        - length_um
        - angle_to_c_axis_deg
        - Dpar_um
        """
        tracks = []
        track_counter = 1

        for df in length_tables:
            for idx, row in df.iterrows():
                sample_id = self._extract_sample_id(row)
                if not sample_id:
                    continue

                track = {
                    'track_id': f"TRK_{track_counter:06d}",
                    'sample_id': sample_id,
                    'length_um': self._extract_field(row, ['length', 'l', 'track length']),
                    'angle_to_c_axis_deg': self._extract_field(row, ['angle', 'c-axis']),
                    'Dpar_um': self._extract_field(row, ['dpar']),
                }

                tracks.append(track)
                track_counter += 1

        return pd.DataFrame(tracks)

    def _create_ahe_table(
        self,
        ahe_tables: List[pd.DataFrame],
        metadata: Dict
    ) -> pd.DataFrame:
        """
        Create ahe_grain_data table (single grain (U-Th)/He ages)

        Required fields:
        - grain_id (PK)
        - sample_id (FK)
        - U_ppm, Th_ppm, Sm_ppm, He_nmol_g
        - raw_age_ma, corrected_age_ma, ft_correction
        - mass_ug, radius_um, grain_geometry
        """
        grains = []

        for df in ahe_tables:
            for idx, row in df.iterrows():
                sample_id = self._extract_sample_id(row)
                if not sample_id:
                    continue

                # Generate grain ID
                grain_num = idx + 1
                grain_id = f"{sample_id}_ahe_{grain_num:02d}"

                grain = {
                    'grain_id': grain_id,
                    'sample_id': sample_id,
                    'U_ppm': self._extract_field(row, ['u', '238u']),
                    'Th_ppm': self._extract_field(row, ['th', '232th']),
                    'Sm_ppm': self._extract_field(row, ['sm', '147sm']),
                    'He_nmol_g': self._extract_field(row, ['he', '4he']),
                    'raw_age_ma': self._extract_field(row, ['raw age', 'uncorrected age']),
                    'corrected_age_ma': self._extract_field(row, ['corrected age', 'age', 'ma']),
                    'ft_correction': self._extract_field(row, ['ft', 'ft correction']),
                    'mass_ug': self._extract_field(row, ['mass', 'weight']),
                    'radius_um': self._extract_field(row, ['radius', 'r']),
                    'grain_geometry': self._extract_field(row, ['geometry', 'shape']),
                    # Metadata
                    'analyst': metadata.get('analyst'),
                    'laboratory': metadata.get('laboratory'),
                }

                grains.append(grain)

        return pd.DataFrame(grains)

    # Helper methods

    def _extract_sample_id(self, row: pd.Series) -> Optional[str]:
        """Extract sample ID from row"""
        # Try common column names
        for col in ['sample', 'sample id', 'sample no', 'id', 'name']:
            for actual_col in row.index:
                if col in str(actual_col).lower():
                    value = row[actual_col]
                    if pd.notna(value):
                        return str(value).strip()
        return None

    def _extract_field(self, row: pd.Series, field_names: List[str]) -> Optional[float]:
        """
        Extract field value from row by trying multiple column names

        Args:
            row: DataFrame row
            field_names: List of possible column names (lowercase)

        Returns:
            Numeric value or None
        """
        for field in field_names:
            for actual_col in row.index:
                if field.lower() in str(actual_col).lower():
                    value = row[actual_col]
                    if pd.notna(value):
                        # Try to convert to numeric
                        try:
                            # Handle ± notation (e.g., "12.3 ± 1.2")
                            if isinstance(value, str) and '±' in value:
                                value = value.split('±')[0].strip()
                            return float(value)
                        except (ValueError, TypeError):
                            # Return string if can't convert
                            return value
        return None

    def _generate_igsn(self, sample_id: str, metadata: Dict) -> str:
        """
        Generate IGSN (International Geo Sample Number)

        Format: IECUR + sample_id (simplified - real IGSN needs registration)
        """
        # This is a placeholder - real IGSN requires SESAR registration
        return f"IECUR{sample_id.replace('-', '').replace(' ', '')}"

    def _generate_grain_ids(self, sample_id: str, n_grains: int) -> List[str]:
        """Generate unique grain IDs for traceability"""
        return [f"{sample_id}_grain_{i+1:02d}" for i in range(n_grains)]

    def _generate_sample_mount_id(self, sample_id: str, mount_date: datetime) -> str:
        """Generate sample mount ID"""
        return f"{sample_id}_mount_{mount_date.strftime('%Y%m%d')}"
