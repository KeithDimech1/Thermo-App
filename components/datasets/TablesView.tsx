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
          // Convert counts to boolean availability
          const availability: TableAvailability = {
            'samples': counts.samples > 0,
            'ft-datapoints': counts.ft_datapoints > 0,
            'ft-count-data': counts.ft_count_data > 0,
            'ft-track-lengths': counts.ft_track_lengths > 0,
            'ft-single-grain-ages': counts.ft_single_grain_ages > 0,
            'ft-binned-length-data': counts.ft_binned_length_data > 0,
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
