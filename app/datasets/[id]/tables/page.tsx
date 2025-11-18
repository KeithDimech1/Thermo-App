'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import InteractiveTable from '@/components/tables/InteractiveTable';
import TableSelector from '@/components/tables/TableSelector';
import DatasetTabs from '@/components/datasets/DatasetTabs';
import Breadcrumb from '@/components/ui/Breadcrumb';

// Type for dynamic table data
type TableData = Record<string, any>;

// Column definitions for each table type
const SAMPLES_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'sample_id', header: 'Sample ID' },
  { accessorKey: 'igsn', header: 'IGSN' },
  { accessorKey: 'latitude', header: 'Latitude' },
  { accessorKey: 'longitude', header: 'Longitude' },
  { accessorKey: 'elevation_m', header: 'Elevation (m)' },
  { accessorKey: 'lithology', header: 'Lithology' },
  { accessorKey: 'mineral_type', header: 'Mineral Type' },
];

const FT_DATAPOINTS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'sample_id', header: 'Sample ID' },
  { accessorKey: 'datapoint_key', header: 'Datapoint Key' },
  { accessorKey: 'laboratory', header: 'Laboratory' },
  { accessorKey: 'pooled_age_ma', header: 'Pooled Age (Ma)' },
  { accessorKey: 'pooled_age_error_ma', header: '± Error' },
  { accessorKey: 'central_age_ma', header: 'Central Age (Ma)' },
  { accessorKey: 'central_age_error_ma', header: '± Error' },
  { accessorKey: 'n_grains', header: 'N Grains' },
  { accessorKey: 'p_chi2_pct', header: 'P(χ²) %' },
  { accessorKey: 'dispersion_pct', header: 'Dispersion (%)' },
];

const FT_COUNT_DATA_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'ft_datapoint_id', header: 'Datapoint ID' },
  { accessorKey: 'grain_id', header: 'Grain ID' },
  { accessorKey: 'ns', header: 'Ns' },
  { accessorKey: 'ni', header: 'Ni' },
  { accessorKey: 'nd', header: 'Nd' },
  { accessorKey: 'rho_s_cm2', header: 'ρs (cm⁻²)' },
  { accessorKey: 'rho_i_cm2', header: 'ρi (cm⁻²)' },
  { accessorKey: 'dpar_um', header: 'Dpar (μm)' },
];

const FT_TRACK_LENGTHS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'ft_datapoint_id', header: 'Datapoint ID' },
  { accessorKey: 'grain_id', header: 'Grain ID' },
  { accessorKey: 'track_id', header: 'Track ID' },
  { accessorKey: 'track_type', header: 'Type' },
  { accessorKey: 'apparent_length_um', header: 'Length (μm)' },
  { accessorKey: 'angle_to_c_axis_deg', header: 'Angle (°)' },
  { accessorKey: 'dpar_um', header: 'Dpar (μm)' },
];

const HE_DATAPOINTS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'sample_id', header: 'Sample ID' },
  { accessorKey: 'datapoint_key', header: 'Datapoint Key' },
  { accessorKey: 'laboratory', header: 'Laboratory' },
  { accessorKey: 'n_aliquots', header: 'N Aliquots' },
  { accessorKey: 'mean_he4_corr_age_ma', header: 'Mean Age (Ma)' },
  { accessorKey: 'se_mean_he4_corr_age_ma', header: 'SE (Ma)' },
  { accessorKey: 'chi_square', header: 'χ²' },
  { accessorKey: 'mswd', header: 'MSWD' },
];

const HE_GRAINS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'he_datapoint_id', header: 'Datapoint ID' },
  { accessorKey: 'grain_id', header: 'Grain ID' },
  { accessorKey: 'he4_uncorr_age_ma', header: 'Uncorr Age (Ma)' },
  { accessorKey: 'he4_corr_age_ma', header: 'Corr Age (Ma)' },
  { accessorKey: 'he4_corr_age_error_ma', header: '± Error' },
  { accessorKey: 'ft_value', header: 'Ft' },
  { accessorKey: 'u_ppm', header: 'U (ppm)' },
  { accessorKey: 'th_ppm', header: 'Th (ppm)' },
  { accessorKey: 'eu_ppm', header: 'eU (ppm)' },
];

const BATCHES_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'batch_name', header: 'Batch Name' },
  { accessorKey: 'analysis_date', header: 'Analysis Date' },
  { accessorKey: 'laboratory', header: 'Laboratory' },
  { accessorKey: 'analytical_session', header: 'Session' },
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
  { accessorKey: 'ft_datapoint_id', header: 'Datapoint ID' },
  { accessorKey: 'grain_id', header: 'Grain ID' },
  { accessorKey: 'grain_age_ma', header: 'Grain Age (Ma)' },
  { accessorKey: 'grain_age_error_ma', header: '± Error' },
  { accessorKey: 'u_ppm', header: 'U (ppm)' },
  { accessorKey: 'rmr0', header: 'rmr₀' },
  { accessorKey: 'kappa', header: 'κ' },
];

const FT_BINNED_LENGTH_DATA_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'ft_datapoint_id', header: 'Datapoint ID' },
  { accessorKey: 'bin_0_1_um', header: '0-1 μm' },
  { accessorKey: 'bin_1_2_um', header: '1-2 μm' },
  { accessorKey: 'bin_2_3_um', header: '2-3 μm' },
  { accessorKey: 'bin_10_11_um', header: '10-11 μm' },
  { accessorKey: 'bin_11_12_um', header: '11-12 μm' },
  { accessorKey: 'bin_12_13_um', header: '12-13 μm' },
  { accessorKey: 'bin_13_14_um', header: '13-14 μm' },
  { accessorKey: 'bin_14_15_um', header: '14-15 μm' },
  { accessorKey: 'dpar_um', header: 'Dpar (μm)' },
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

interface Dataset {
  id: number;
  dataset_name: string;
}

interface Props {
  params: {
    id: string;
  };
}

export default function DatasetTablesPage({ params }: Props) {
  const datasetId = params.id;
  const [selectedTable, setSelectedTable] = useState('samples');
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);

  const columns = TABLE_COLUMNS[selectedTable] || SAMPLES_COLUMNS;

  // Fetch dataset info on mount
  useEffect(() => {
    async function fetchDataset() {
      try {
        // For now, we'll use a simple approach - get from samples or other tables
        // In a real app, you'd want a dedicated /api/datasets/[id] endpoint
        const response = await fetch(`/api/tables/samples?dataset_id=${datasetId}&limit=1`);
        const result = await response.json();

        if (result.data && result.data.length > 0) {
          // We have data for this dataset
          setDataset({
            id: parseInt(datasetId),
            dataset_name: `Dataset ${datasetId}`
          });
        }
      } catch (err) {
        console.error('Error loading dataset:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDataset();
  }, [datasetId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-500">Loading dataset...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Datasets', href: '/datasets' },
        { label: `Dataset ${datasetId}`, href: `/datasets/${datasetId}` },
        { label: 'Data Tables' }
      ]} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Data Tables</h1>
        <p className="text-lg text-slate-600">
          Browse FAIR-compliant thermochronology data - view samples, analytical results, and QC metadata
        </p>
      </div>

      {/* Dataset Tabs */}
      <DatasetTabs datasetId={parseInt(datasetId)} activeTab="tables" />

      {/* Table Selector */}
      <div className="mb-6">
        <TableSelector
          selectedTable={selectedTable}
          onTableChange={setSelectedTable}
        />
      </div>

      {/* Interactive Table */}
      <InteractiveTable
        tableName={selectedTable}
        columns={columns}
        datasetFilter={datasetId}
      />
    </div>
  );
}
