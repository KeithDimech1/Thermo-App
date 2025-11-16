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

const FT_AGES_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'sample_id', header: 'Sample ID' },
  { accessorKey: 'pooled_age_ma', header: 'Pooled Age (Ma)' },
  { accessorKey: 'pooled_age_error_ma', header: '± Error' },
  { accessorKey: 'central_age_ma', header: 'Central Age (Ma)' },
  { accessorKey: 'central_age_error_ma', header: '± Error' },
  { accessorKey: 'n_grains', header: 'N Grains' },
  { accessorKey: 'p_chi2', header: 'P(χ²)' },
  { accessorKey: 'dispersion_pct', header: 'Dispersion (%)' },
];

const FT_COUNTS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'sample_id', header: 'Sample ID' },
  { accessorKey: 'grain_id', header: 'Grain ID' },
  { accessorKey: 'ns', header: 'Ns' },
  { accessorKey: 'ni', header: 'Ni' },
  { accessorKey: 'nd', header: 'Nd' },
  { accessorKey: 'rho_s_cm2', header: 'ρs (cm⁻²)' },
  { accessorKey: 'rho_i_cm2', header: 'ρi (cm⁻²)' },
  { accessorKey: 'rho_d_cm2', header: 'ρd (cm⁻²)' },
];

const TRACK_LENGTHS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'sample_id', header: 'Sample ID' },
  { accessorKey: 'grain_id', header: 'Grain ID' },
  { accessorKey: 'mean_track_length_um', header: 'Mean Length (μm)' },
  { accessorKey: 'mean_track_length_sd_um', header: 'SD (μm)' },
  { accessorKey: 'dpar_um', header: 'Dpar (μm)' },
  { accessorKey: 'angle_to_c_axis_deg', header: 'Angle to c-axis (°)' },
];

const AHE_GRAINS_COLUMNS: ColumnDef<TableData>[] = [
  { accessorKey: 'sample_id', header: 'Sample ID' },
  { accessorKey: 'lab_no', header: 'Lab No' },
  { accessorKey: 'uncorr_age_ma', header: 'Uncorr Age (Ma)' },
  { accessorKey: 'corr_age_ma', header: 'Corr Age (Ma)' },
  { accessorKey: 'corr_age_1sigma_ma', header: '± 1σ' },
  { accessorKey: 'ft', header: 'Ft' },
  { accessorKey: 'u_ppm', header: 'U (ppm)' },
  { accessorKey: 'th_ppm', header: 'Th (ppm)' },
];

const TABLE_COLUMNS: Record<string, ColumnDef<TableData>[]> = {
  'samples': SAMPLES_COLUMNS,
  'ft-ages': FT_AGES_COLUMNS,
  'ft-counts': FT_COUNTS_COLUMNS,
  'track-lengths': TRACK_LENGTHS_COLUMNS,
  'ahe-grains': AHE_GRAINS_COLUMNS,
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
