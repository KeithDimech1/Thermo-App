'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import InteractiveTable from '@/components/tables/InteractiveTable';
import TableSelector from '@/components/tables/TableSelector';

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

const DATASETS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'dataset_name', header: 'Dataset Name' },
  { accessorKey: 'publication_year', header: 'Year' },
  { accessorKey: 'publication_journal', header: 'Journal' },
  { accessorKey: 'study_location', header: 'Location' },
  { accessorKey: 'mineral_analyzed', header: 'Mineral' },
  { accessorKey: 'sample_count', header: 'Samples' },
  { accessorKey: 'fair_score', header: 'FAIR Score' },
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
  'datasets': DATASETS_COLUMNS,
};

interface Dataset {
  id: number;
  dataset_name: string;
}

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState('samples');
  const [selectedDataset, setSelectedDataset] = useState<string>('all');
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  const columns = TABLE_COLUMNS[selectedTable] || SAMPLES_COLUMNS;

  // Fetch datasets on mount
  useEffect(() => {
    fetch('/api/datasets')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setDatasets(json.data);
        }
      })
      .catch(err => console.error('Error loading datasets:', err));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">📊 Data Tables</h1>
        <p className="text-lg text-slate-600">
          Excel-like interactive data tables with sorting and pagination
        </p>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Dataset Filter */}
        <div className="space-y-2">
          <label htmlFor="dataset-filter" className="block text-sm font-medium text-gray-700">
            Filter by Dataset/Paper:
          </label>
          <select
            id="dataset-filter"
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Datasets</option>
            {datasets.map(dataset => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.dataset_name}
              </option>
            ))}
          </select>
        </div>

        {/* Table Selector */}
        <div>
          <TableSelector
            selectedTable={selectedTable}
            onTableChange={setSelectedTable}
          />
        </div>
      </div>

      {/* Interactive Table */}
      <InteractiveTable
        tableName={selectedTable}
        columns={columns}
        datasetFilter={selectedDataset}
      />
    </div>
  );
}
