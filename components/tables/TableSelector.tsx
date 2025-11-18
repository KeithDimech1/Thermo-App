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
  // Core FAIR Tables - Universal access
  {
    value: 'datasets',
    label: 'Datasets',
    description: 'Published papers and data packages (DOI, authors, location)'
  },
  {
    value: 'samples',
    label: 'Samples',
    description: 'Geosample metadata (IGSN, location, lithology, mineral)'
  },
  {
    value: 'ft-datapoints',
    label: 'FT Datapoints',
    description: 'Fission-track analytical results (ages, dispersion, n-grains)'
  },
  {
    value: 'he-datapoints',
    label: 'He Datapoints',
    description: '(U-Th)/He analytical results (mean ages, QC statistics)'
  },
  {
    value: 'people',
    label: 'People',
    description: 'Researchers and analysts (ORCID, affiliation)'
  },
  {
    value: 'batches',
    label: 'Batches',
    description: 'Analytical batches (QC reference materials, session metadata)'
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
