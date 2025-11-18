#!/usr/bin/env python3
"""
Extract exact field names from transformed EarthBank CSVs.
This will tell us what the database schema should actually be.
"""

import csv
from pathlib import Path
from collections import defaultdict

def get_csv_headers(csv_path):
    """Read CSV and return header row."""
    with open(csv_path, 'r') as f:
        reader = csv.reader(f)
        return next(reader)

# Define CSV paths
csv_files = {
    'samples': [
        'build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_samples_complete.csv',
        'build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_samples.csv',
        'build-data/learning/thermo-papers/Dusel-Bacon(2015)-AFT-regional-exhumation-subtropical-Eocene-Alaska-CJES/FAIR/earthbank_samples.csv',
    ],
    'ftDatapoints': [
        'build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_ft_datapoints_complete.csv',
        'build-data/learning/thermo-papers/Dusel-Bacon(2015)-AFT-regional-exhumation-subtropical-Eocene-Alaska-CJES/FAIR/earthbank_ft_datapoints.csv',
    ],
    'ftTrackLengthData': [
        'build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_ft_track_length_data_complete.csv',
    ],
    'heDatapoints': [
        'build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_he_datapoints.csv',
    ],
    'heWholeGrainData': [
        'build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_he_whole_grain_complete.csv',
        'build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_he_whole_grain_data.csv',
    ],
}

# Collect all fields for each table type
table_fields = defaultdict(set)

print("=" * 80)
print("ACTUAL CSV FIELD NAMES FROM TRANSFORMED EARTHBANK DATA")
print("=" * 80)

for table_name, csv_paths in csv_files.items():
    print(f"\n{table_name}:")
    print("-" * 80)

    for csv_path in csv_paths:
        if Path(csv_path).exists():
            headers = get_csv_headers(csv_path)
            table_fields[table_name].update(headers)
            print(f"\n  {Path(csv_path).parent.parent.name}:")
            print(f"    Fields ({len(headers)}): {', '.join(headers)}")

    # Show union of all fields
    all_fields = sorted(table_fields[table_name])
    print(f"\n  ALL UNIQUE FIELDS ({len(all_fields)}):")
    for i, field in enumerate(all_fields, 1):
        print(f"    {i:3d}. {field}")

print("\n" + "=" * 80)
print("SCHEMA RECOMMENDATIONS")
print("=" * 80)

for table_name, fields in table_fields.items():
    print(f"\n{table_name}: {len(fields)} fields")
    print(f"  Use these exact names in database schema")
