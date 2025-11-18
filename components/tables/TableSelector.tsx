'use client';

interface TableOption {
  value: string;
  label: string;
  description: string;
}

interface TableSelectorProps {
  selectedTable: string;
  onTableChange: (tableName: string) => void;
  tableAvailability?: { [key: string]: boolean };
  loading?: boolean;
}

const TABLE_OPTIONS: TableOption[] = [
  // Core sample metadata
  {
    value: 'samples',
    label: 'Samples - Geosample metadata',
    description: 'IGSN, location, lithology, mineral type'
  },
  // Fission-track tables
  {
    value: 'ft-datapoints',
    label: 'FT Analytical Sessions - Pooled/central ages',
    description: 'Fission-track analytical results with QC statistics'
  },
  {
    value: 'ft-count-data',
    label: 'FT Grain Counts - Individual grain track densities',
    description: 'Ns, Ni, Nd, rho values per grain'
  },
  {
    value: 'ft-track-lengths',
    label: 'FT Track Lengths - Individual confined track measurements',
    description: 'Track-by-track lengths and c-axis angles'
  },
  {
    value: 'ft-single-grain-ages',
    label: 'FT Single Grain Ages - Individual grain age calculations',
    description: 'Per-grain ages with U content and kinetic parameters'
  },
  {
    value: 'ft-binned-length-data',
    label: 'FT Binned Track Lengths - Length distribution histograms',
    description: 'Track length frequency data in 1-micron bins'
  },
  // (U-Th)/He tables
  {
    value: 'he-datapoints',
    label: 'He Analytical Sessions - Mean corrected ages',
    description: '(U-Th)/He analytical results with QC statistics'
  },
  {
    value: 'he-grains',
    label: 'He Single Grains - Individual aliquot data',
    description: 'Per-grain ages, Ft corrections, U/Th chemistry'
  },
];

export default function TableSelector({
  selectedTable,
  onTableChange,
  tableAvailability,
  loading
}: TableSelectorProps) {
  const selectedOption = TABLE_OPTIONS.find(opt => opt.value === selectedTable);

  // Filter options to only show tables with data (if availability info is provided)
  const availableOptions = TABLE_OPTIONS.filter(option => {
    // If no availability data yet, show all options
    if (!tableAvailability || Object.keys(tableAvailability).length === 0) {
      return true;
    }
    // Otherwise, only show tables that have data
    return tableAvailability[option.value] === true;
  });

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Table:
        </label>
        <div className="text-sm text-gray-500">Loading available tables...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="table-select" className="block text-sm font-medium text-gray-700">
        Select Table:
      </label>
      <select
        id="table-select"
        value={selectedTable}
        onChange={(e) => onTableChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
      >
        {availableOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
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
