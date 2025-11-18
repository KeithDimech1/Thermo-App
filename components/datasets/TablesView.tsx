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
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'datapointName', header: 'Datapoint Name' },
  { accessorKey: 'sampleID', header: 'Sample ID' },
  { accessorKey: 'laboratory', header: 'Laboratory' },
  { accessorKey: 'pooledAgeMa', header: 'Pooled Age (Ma)' },
  { accessorKey: 'pooledAgeUncertaintyMa', header: '± Error' },
  { accessorKey: 'centralAgeMa', header: 'Central Age (Ma)' },
  { accessorKey: 'centralAgeUncertaintyMa', header: '± Error' },
  { accessorKey: 'nGrains', header: 'N Grains' },
  { accessorKey: 'pChi2', header: 'P(χ²) %' },
  { accessorKey: 'dispersion', header: 'Dispersion (%)' },
  { accessorKey: 'mtl', header: 'MTL (μm)' },
];

const FT_COUNT_DATA_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'datapointName', header: 'Datapoint Name' },
  { accessorKey: 'grainName', header: 'Grain Name' },
  { accessorKey: 'ns', header: 'Ns' },
  { accessorKey: 'ni', header: 'Ni' },
  { accessorKey: 'nd', header: 'Nd' },
  { accessorKey: 'rhoS', header: 'ρs (cm⁻²)' },
  { accessorKey: 'rhoI', header: 'ρi (cm⁻²)' },
  { accessorKey: 'rhoD', header: 'ρd (cm⁻²)' },
  { accessorKey: 'dPar', header: 'Dpar (μm)' },
];

const FT_TRACK_LENGTHS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'datapointName', header: 'Datapoint Name' },
  { accessorKey: 'grainName', header: 'Grain Name' },
  { accessorKey: 'trackID', header: 'Track ID' },
  { accessorKey: 'trackType', header: 'Type' },
  { accessorKey: 'lengthUm', header: 'Length (μm)' },
  { accessorKey: 'cAxisAngleDeg', header: 'Angle (°)' },
  { accessorKey: 'dPar', header: 'Dpar (μm)' },
];

const HE_DATAPOINTS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'datapointName', header: 'Datapoint Name' },
  { accessorKey: 'sampleID', header: 'Sample ID' },
  { accessorKey: 'laboratory', header: 'Laboratory' },
  { accessorKey: 'nGrains', header: 'N Grains' },
  { accessorKey: 'meanCorrectedAgeMa', header: 'Mean Age (Ma)' },
  { accessorKey: 'meanCorrectedAgeUncertaintyMa', header: 'SE (Ma)' },
  { accessorKey: 'chi2pct', header: 'χ²' },
  { accessorKey: 'MSWD', header: 'MSWD' },
];

const HE_GRAINS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'datapointName', header: 'Datapoint Name' },
  { accessorKey: 'grainName', header: 'Grain Name' },
  { accessorKey: 'uncorrectedHeAge', header: 'Uncorr Age (Ma)' },
  { accessorKey: 'correctedHeAge', header: 'Corr Age (Ma)' },
  { accessorKey: 'correctedHeAgeUncertainty', header: '± Error' },
  { accessorKey: 'ft', header: 'Ft' },
  { accessorKey: 'uConcentration', header: 'U (ppm)' },
  { accessorKey: 'thConcentration', header: 'Th (ppm)' },
  { accessorKey: 'eU', header: 'eU (ppm)' },
];

const BATCHES_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'batchName', header: 'Batch Name' },
  { accessorKey: 'analysisDate', header: 'Analysis Date' },
  { accessorKey: 'laboratory', header: 'Laboratory' },
  { accessorKey: 'analyticalSession', header: 'Session' },
];

const PEOPLE_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'orcid', header: 'ORCID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'affiliation', header: 'Affiliation' },
  { accessorKey: 'email', header: 'Email' },
];

const FT_SINGLE_GRAIN_AGES_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'datapointName', header: 'Datapoint Name' },
  { accessorKey: 'grainName', header: 'Grain Name' },
  { accessorKey: 'ageMa', header: 'Grain Age (Ma)' },
  { accessorKey: 'ageUncertaintyMa', header: '± Error' },
  { accessorKey: 'uPpm', header: 'U (ppm)' },
  { accessorKey: 'rmr0', header: 'rmr₀' },
  { accessorKey: 'kappa', header: 'κ' },
];

const FT_BINNED_LENGTH_DATA_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'datapointName', header: 'Datapoint Name' },
  { accessorKey: 'i0x1', header: '0-1 μm' },
  { accessorKey: 'i1x2', header: '1-2 μm' },
  { accessorKey: 'i2x3', header: '2-3 μm' },
  { accessorKey: 'i10x11', header: '10-11 μm' },
  { accessorKey: 'i11x12', header: '11-12 μm' },
  { accessorKey: 'i12x13', header: '12-13 μm' },
  { accessorKey: 'i13x14', header: '13-14 μm' },
  { accessorKey: 'i14x15', header: '14-15 μm' },
  { accessorKey: 'dPar', header: 'Dpar (μm)' },
];

const TABLE_COLUMNS: Record<string, ColumnDef<TableData>[]> = {
  'samples': SAMPLES_COLUMNS,
  'ft-datapoints': FT_DATAPOINTS_COLUMNS,
  'ft-count-data': FT_COUNT_DATA_COLUMNS,
  'ft-track-lengths': FT_TRACK_LENGTHS_COLUMNS,
  'ft-single-grain-ages': FT_SINGLE_GRAIN_AGES_COLUMNS,
  'ft-binned-length-data': FT_BINNED_LENGTH_DATA_COLUMNS,
  'he-datapoints': HE_DATAPOINTS_COLUMNS,
  'he-grains': HE_GRAINS_COLUMNS,
  'batches': BATCHES_COLUMNS,
  'people': PEOPLE_COLUMNS,
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
          // Convert counts to boolean availability (EarthBank camelCase response)
          const availability: TableAvailability = {
            'samples': counts.samples > 0,
            'ft-datapoints': counts.ftDatapoints > 0,
            'ft-count-data': counts.ftCountData > 0,
            'ft-track-lengths': counts.ftTrackLengthData > 0,
            'ft-single-grain-ages': counts.ftSingleGrainAges > 0,
            'ft-binned-length-data': counts.ftBinnedLengthData > 0,
            'he-datapoints': counts.heDatapoints > 0,
            'he-grains': counts.heWholeGrainData > 0,
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
