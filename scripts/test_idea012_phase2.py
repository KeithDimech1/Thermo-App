#!/usr/bin/env python3
"""
Test IDEA-012 Phase 2: Multi-Method Table Extraction

Tests the enhanced extraction workflow on McMillan(2024) Malawi paper
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.pdf.multi_method_extraction import extract_all_tables_multi_method

def main():
    # Test parameters
    paper_dir = Path('build-data/learning/thermo-papers/McMillan(2024)-Malawi-Rift-4D-Fault-Evolution')
    pdf_path = paper_dir / 'McMillan-2024-Malawi-Rift.pdf'
    raw_dir = paper_dir / 'RAW'

    print('=' * 60)
    print('IDEA-012 PHASE 2 TEST: Multi-Method Table Extraction')
    print('=' * 60)
    print()
    print(f'Paper: {paper_dir.name}')
    print(f'PDF: {pdf_path.name}')
    print(f'Output: {raw_dir}')
    print()

    # Check prerequisites
    if not pdf_path.exists():
        print(f'❌ ERROR: PDF not found at {pdf_path}')
        sys.exit(1)

    text_index = paper_dir / 'text' / 'text-index.md'
    if not text_index.exists():
        print(f'❌ ERROR: Phase 1 output not found (text/text-index.md missing)')
        print(f'   Run /thermoanalysis first!')
        sys.exit(1)

    print('✅ Prerequisites met')
    print()

    # Run multi-method extraction
    print('Starting multi-method extraction...')
    print()

    try:
        results = extract_all_tables_multi_method(
            paper_dir=paper_dir,
            pdf_path=pdf_path,
            output_dir=raw_dir
        )

        print()
        print('=' * 60)
        print('TEST RESULTS')
        print('=' * 60)
        print()
        print(f'✅ Extraction completed successfully!')
        print(f'   Tables processed: {len(results)}')
        print()

        # Summary of results
        print('Per-table results:')
        for i, result in enumerate(results, 1):
            table_name = result['table_info']['name']
            table_type = result['table_info']['type']
            best_method = result['best_method']
            best_score = result['best_score']

            print(f'{i}. {table_name} ({table_type})')
            print(f'   Best method: {best_method}')
            print(f'   Score: {best_score:.2f}')
            print()

        # Check outputs
        print('Output files created:')
        if raw_dir.exists():
            csv_files = list(raw_dir.glob('*.csv'))
            print(f'   CSV files: {len(csv_files)}')
            for csv_file in sorted(csv_files)[:10]:  # Show first 10
                print(f'     - {csv_file.name}')
            if len(csv_files) > 10:
                print(f'     ... and {len(csv_files) - 10} more')

            report = raw_dir / 'comparison-report.md'
            if report.exists():
                print(f'   ✅ Comparison report: {report.name}')
            else:
                print(f'   ⚠️  Comparison report not found')
        else:
            print(f'   ❌ RAW/ directory not created')

        print()
        print('=' * 60)
        print('✅ IDEA-012 PHASE 2 TEST PASSED!')
        print('=' * 60)

    except Exception as e:
        print()
        print('=' * 60)
        print('❌ TEST FAILED')
        print('=' * 60)
        print()
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
