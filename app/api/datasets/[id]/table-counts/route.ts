import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

/**
 * GET /api/datasets/[id]/table-counts
 *
 * Returns count of records in each table for a specific dataset.
 * Used to determine which tables have data and should be shown in the UI.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const datasetId = id;

    // Query to get counts for all related tables
    const countQuery = `
      SELECT
        -- Samples
        (SELECT COUNT(*) FROM samples WHERE dataset_id = $1) as samples,

        -- FT tables (joined through samples)
        (SELECT COUNT(*)
         FROM ft_datapoints ftd
         JOIN samples s ON ftd.sample_id = s.sample_id
         WHERE s.dataset_id = $1) as ft_datapoints,

        (SELECT COUNT(*)
         FROM ft_count_data fcd
         JOIN ft_datapoints ftd ON fcd.ft_datapoint_id = ftd.id
         JOIN samples s ON ftd.sample_id = s.sample_id
         WHERE s.dataset_id = $1) as ft_count_data,

        (SELECT COUNT(*)
         FROM ft_track_length_data ftl
         JOIN ft_datapoints ftd ON ftl.ft_datapoint_id = ftd.id
         JOIN samples s ON ftd.sample_id = s.sample_id
         WHERE s.dataset_id = $1) as ft_track_lengths,

        (SELECT COUNT(*)
         FROM ft_single_grain_ages fsg
         JOIN ft_datapoints ftd ON fsg.ft_datapoint_id = ftd.id
         JOIN samples s ON ftd.sample_id = s.sample_id
         WHERE s.dataset_id = $1) as ft_single_grain_ages,

        (SELECT COUNT(*)
         FROM ft_binned_length_data fbl
         JOIN ft_datapoints ftd ON fbl.ft_datapoint_id = ftd.id
         JOIN samples s ON ftd.sample_id = s.sample_id
         WHERE s.dataset_id = $1) as ft_binned_length_data,

        -- He tables (joined through samples)
        (SELECT COUNT(*)
         FROM he_datapoints hd
         JOIN samples s ON hd.sample_id = s.sample_id
         WHERE s.dataset_id = $1) as he_datapoints,

        (SELECT COUNT(*)
         FROM he_whole_grain_data hg
         JOIN he_datapoints hd ON hg.he_datapoint_id = hd.id
         JOIN samples s ON hd.sample_id = s.sample_id
         WHERE s.dataset_id = $1) as he_grains
    `;

    const result = await query(countQuery, [datasetId]);

    if (!result || result.length === 0) {
      return NextResponse.json({
        samples: 0,
        ft_datapoints: 0,
        ft_count_data: 0,
        ft_track_lengths: 0,
        ft_single_grain_ages: 0,
        ft_binned_length_data: 0,
        he_datapoints: 0,
        he_grains: 0,
      });
    }

    // Convert string counts to integers
    const counts = result[0];
    const intCounts = Object.fromEntries(
      Object.entries(counts).map(([key, value]) => [key, parseInt(value as string, 10)])
    );

    return NextResponse.json(intCounts);
  } catch (error) {
    console.error('Error fetching table counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table counts' },
      { status: 500 }
    );
  }
}
