'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import InteractiveTable from '@/components/tables/InteractiveTable';
import TableSelector from '@/components/tables/TableSelector';

// Type for dynamic table data
type TableData = Record<string, any>;

// Type for table availability
interface TableAvailability {
  [key: string]: boolean;
}

// Column definitions for each table type (EarthBank camelCase schema)
const SAMPLES_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'sampleID', header: 'Sample ID' },
  { accessorKey: 'IGSN', header: 'IGSN' },
  { accessorKey: 'latitude', header: 'Latitude' },
  { accessorKey: 'longitude', header: 'Longitude' },
  { accessorKey: 'elevationM', header: 'Elevation (m)' },
  { accessorKey: 'lithology', header: 'Lithology' },
  { accessorKey: 'mineralType', header: 'Mineral Type' },
];

const FT_DATAPOINTS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'datapointName', header: 'Datapoint Name' },
  { accessorKey: 'sampleID', header: 'Sample ID' },
  { accessorKey: 'laboratory', header: 'Laboratory' },
  { accessorKey: 'analyst', header: 'Analyst' },
  { accessorKey: 'pooledAgeMa', header: 'Pooled Age (Ma)' },
  { accessorKey: 'pooledAgeUncertainty', header: '±1σ' },
  { accessorKey: 'centralAgeMa', header: 'Central Age (Ma)' },
  { accessorKey: 'centralAgeUncertainty', header: '±1σ' },
  { accessorKey: 'nGrains', header: 'N Grains' },
  { accessorKey: 'pChi2', header: 'P(χ²) %' },
  { accessorKey: 'dispersion', header: 'Dispersion (%)' },
];

const FT_TRACK_LENGTHS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'datapointName', header: 'Datapoint Name' },
  { accessorKey: 'grainName', header: 'Grain Name' },
  { accessorKey: 'trackID', header: 'Track ID' },
  { accessorKey: 'trackType', header: 'Type' },
  { accessorKey: 'lengthUm', header: 'Length (μm)' },
  { accessorKey: 'cAxisAngleDeg', header: 'C-Axis Angle (°)' },
  { accessorKey: 'dPar', header: 'Dpar (μm)' },
];

const HE_DATAPOINTS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'datapointName', header: 'Datapoint Name' },
  { accessorKey: 'sampleID', header: 'Sample ID' },
  { accessorKey: 'laboratory', header: 'Laboratory' },
  { accessorKey: 'analyst', header: 'Analyst' },
  { accessorKey: 'nGrains', header: 'N Grains' },
  { accessorKey: 'meanCorrectedAgeMa', header: 'Mean Age (Ma)' },
  { accessorKey: 'meanCorrectedAgeUncertainty', header: '±1σ' },
  { accessorKey: 'meanUncorrectedAgeMa', header: 'Uncorr. Age (Ma)' },
];

const HE_GRAINS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'datapointName', header: 'Datapoint Name' },
  { accessorKey: 'grainName', header: 'Grain Name' },
  { accessorKey: 'correctedHeAge', header: 'Corr Age (Ma)' },
  { accessorKey: 'correctedHeAgeUncertainty', header: '±1σ' },
  { accessorKey: 'uncorrectedHeAge', header: 'Uncorr Age (Ma)' },
  { accessorKey: 'ft', header: 'Ft' },
  { accessorKey: 'uConcentration', header: 'U (ppm)' },
  { accessorKey: 'thConcentration', header: 'Th (ppm)' },
  { accessorKey: 'eU', header: 'eU (ppm)' },
];

const TABLE_COLUMNS: Record<string, ColumnDef<TableData>[]> = {
  'samples': SAMPLES_COLUMNS,
  'ft-datapoints': FT_DATAPOINTS_COLUMNS,
  'ft-track-lengths': FT_TRACK_LENGTHS_COLUMNS,
  'he-datapoints': HE_DATAPOINTS_COLUMNS,
  'he-grains': HE_GRAINS_COLUMNS,
};

interface TablesViewProps {
  datasetId: string;
}

export default function TablesView({ datasetId }: TablesViewProps) {
  const [selectedTable, setSelectedTable] = useState('samples');
  const [tableAvailability, setTableAvailability] = useState<TableAvailability>({});
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const columns = TABLE_COLUMNS[selectedTable] || SAMPLES_COLUMNS;

  // Fetch table availability for this dataset
  useEffect(() => {
    async function fetchTableAvailability() {
      setLoadingAvailability(true);
      try {
        const response = await fetch(`/api/datasets/${datasetId}/table-counts`);
        if (response.ok) {
          const counts = await response.json();
          // Convert counts to boolean availability (EarthBank schema)
          const availability: TableAvailability = {
            'samples': counts.samples > 0,
            'ft-datapoints': counts.ft_datapoints > 0,
            'ft-track-lengths': counts.ft_track_lengths > 0,
            'he-datapoints': counts.he_datapoints > 0,
            'he-grains': counts.he_grains > 0,
          };
          setTableAvailability(availability);
        }
      } catch (error) {
        console.error('Failed to fetch table availability:', error);
        // Default to showing all tables if check fails
        setTableAvailability({});
      } finally {
        setLoadingAvailability(false);
      }
    }

    fetchTableAvailability();
  }, [datasetId]);

  return (
    <>
      {/* Table Selector */}
      <div className="mb-6">
        <TableSelector
          selectedTable={selectedTable}
          onTableChange={setSelectedTable}
          tableAvailability={tableAvailability}
          loading={loadingAvailability}
        />
      </div>

      {/* Interactive Table - Always filtered by dataset */}
      <InteractiveTable
        tableName={selectedTable}
        columns={columns}
        datasetFilter={datasetId}
      />
    </>
  );
}
