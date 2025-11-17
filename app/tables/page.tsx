'use client';

import { useState } from 'react';
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

const TABLE_COLUMNS: Record<string, ColumnDef<TableData>[]> = {
  'samples': SAMPLES_COLUMNS,
  'ft-datapoints': FT_DATAPOINTS_COLUMNS,
  'ft-count-data': FT_COUNT_DATA_COLUMNS,
  'ft-track-lengths': FT_TRACK_LENGTHS_COLUMNS,
  'he-datapoints': HE_DATAPOINTS_COLUMNS,
  'he-grains': HE_GRAINS_COLUMNS,
  'batches': BATCHES_COLUMNS,
  'people': PEOPLE_COLUMNS,
};

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState('samples');

  const columns = TABLE_COLUMNS[selectedTable] || SAMPLES_COLUMNS;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">📊 Data Tables</h1>
        <p className="text-lg text-slate-600">
          Excel-like interactive data tables with sorting and pagination
        </p>
      </div>

      {/* Table Selector */}
      <div className="mb-6">
        <TableSelector
          selectedTable={selectedTable}
          onTableChange={setSelectedTable}
        />
      </div>

      {/* Interactive Table */}
      <InteractiveTable tableName={selectedTable} columns={columns} />
    </div>
  );
}
