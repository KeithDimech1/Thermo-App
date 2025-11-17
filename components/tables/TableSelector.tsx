'use client';

interface TableOption {
  value: string;
  label: string;
  description: string;
}

interface TableSelectorProps {
  selectedTable: string;
  onTableChange: (tableName: string) => void;
}

const TABLE_OPTIONS: TableOption[] = [
  // FAIR EarthBank Core Tables (4 required tables)
  {
    value: 'samples',
    label: '⭐ Samples (FAIR Table)',
    description: 'EarthBank Sample Template - Geosample metadata (IGSN, location, lithology)'
  },
  {
    value: 'ft-datapoints',
    label: '⭐ FT Datapoints (FAIR Table)',
    description: 'EarthBank FTDatapoint Template - Fission-track analytical sessions'
  },
  {
    value: 'ft-track-lengths',
    label: '⭐ FT Track Lengths (FAIR Table)',
    description: 'EarthBank FTLengthData - Individual track measurements'
  },
  {
    value: 'he-grains',
    label: '⭐ He Whole Grain Data (FAIR Table)',
    description: 'EarthBank HeWholeGrain - Single grain (U-Th)/He results'
  },
  // Additional Fission-Track Data
  {
    value: 'ft-count-data',
    label: 'FT Count Data',
    description: 'Grain-by-grain track count data (Ns, Ni, Nd, Dpar)'
  },
  {
    value: 'ft-single-grain-ages',
    label: 'FT Single Grain Ages',
    description: 'Individual grain ages (not just pooled/central)'
  },
  {
    value: 'ft-binned-length-data',
    label: 'FT Binned Length Data',
    description: 'Binned track length histograms (legacy format)'
  },
  // (U-Th)/He Data
  {
    value: 'he-datapoints',
    label: 'He Datapoints',
    description: '(U-Th)/He analytical sessions (mean ages, QC stats)'
  },
  // Infrastructure
  {
    value: 'batches',
    label: 'Batches',
    description: 'Analytical batches (linking samples to reference materials)'
  },
  {
    value: 'people',
    label: 'People',
    description: 'Researchers (ORCID-based provenance)'
  },
  {
    value: 'datasets',
    label: 'Datasets',
    description: 'Data packages with privacy controls and DOI'
  }
];

export default function TableSelector({ selectedTable, onTableChange }: TableSelectorProps) {
  const selectedOption = TABLE_OPTIONS.find(opt => opt.value === selectedTable);

  return (
    <div className="space-y-2">
      <label htmlFor="table-select" className="block text-sm font-medium text-gray-700">
        Select Table:
      </label>
      <select
        id="table-select"
        value={selectedTable}
        onChange={(e) => onTableChange(e.target.value)}
        className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        {TABLE_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label} - {option.description}
          </option>
        ))}
      </select>
      {selectedOption && (
        <p className="text-sm text-gray-500">
          {selectedOption.description}
        </p>
      )}
    </div>
  );
}
