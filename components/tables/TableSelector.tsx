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
  {
    value: 'samples',
    label: 'Samples',
    description: 'Geosample metadata (locations, lithology)'
  },
  {
    value: 'ft-ages',
    label: 'Fission-Track Ages',
    description: 'Calculated AFT ages with statistics'
  },
  {
    value: 'ft-counts',
    label: 'FT Track Counts',
    description: 'Grain-by-grain track count data'
  },
  {
    value: 'track-lengths',
    label: 'Track Lengths',
    description: 'Confined track length measurements'
  },
  {
    value: 'ahe-grains',
    label: '(U-Th)/He Grain Data',
    description: 'Single grain (U-Th)/He ages'
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
