import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { query } from '@/lib/db/connection';

/**
 * GET /api/datasets/[id]/table-counts
 *
 * Returns count of records in each table for a specific dataset.
 * Used to determine which tables have data and should be shown in the UI.
 *
 * SCHEMA: EarthBank camelCase (IDEA-014)
 * NOTE: Some old tables (ft_count_data, ft_single_grain_ages, ft_binned_length_data)
 *       are not present in EarthBank schema - returning 0 for these.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const datasetId = id;

    // Query to get counts for all related tables (EarthBank schema)
    const countQuery = `
      SELECT
        -- Samples
        (SELECT COUNT(*) FROM earthbank_samples WHERE "datasetID" = $1) as samples,

        -- FT tables (joined through samples)
        (SELECT COUNT(*)
         FROM "earthbank_ftDatapoints" ftd
         JOIN earthbank_samples s ON ftd."sampleID" = s."sampleID"
         WHERE s."datasetID" = $1) as ft_datapoints,

        -- Track lengths (joined through datapoints)
        (SELECT COUNT(*)
         FROM "earthbank_ftTrackLengthData" ftl
         JOIN "earthbank_ftDatapoints" ftd ON ftl."datapointName" = ftd."datapointName"
         JOIN earthbank_samples s ON ftd."sampleID" = s."sampleID"
         WHERE s."datasetID" = $1) as ft_track_lengths,

        -- He tables (joined through samples)
        (SELECT COUNT(*)
         FROM "earthbank_heDatapoints" hd
         JOIN earthbank_samples s ON hd."sampleID" = s."sampleID"
         WHERE s."datasetID" = $1) as he_datapoints,

        (SELECT COUNT(*)
         FROM "earthbank_heWholeGrainData" hg
         JOIN "earthbank_heDatapoints" hd ON hg."datapointName" = hd."datapointName"
         JOIN earthbank_samples s ON hd."sampleID" = s."sampleID"
         WHERE s."datasetID" = $1) as he_grains
    `;

    const result = await query(countQuery, [datasetId]);

    if (!result || result.length === 0) {
      return NextResponse.json({
        samples: 0,
        ft_datapoints: 0,
        ft_count_data: 0, // Not in EarthBank schema
        ft_track_lengths: 0,
        ft_single_grain_ages: 0, // Not in EarthBank schema
        ft_binned_length_data: 0, // Not in EarthBank schema
        he_datapoints: 0,
        he_grains: 0,
      });
    }

    // Convert string counts to integers and add missing tables as 0
    const counts = result[0];
    const intCounts = {
      samples: parseInt(counts.samples as string, 10),
      ft_datapoints: parseInt(counts.ft_datapoints as string, 10),
      ft_count_data: 0, // Not in EarthBank schema
      ft_track_lengths: parseInt(counts.ft_track_lengths as string, 10),
      ft_single_grain_ages: 0, // Not in EarthBank schema
      ft_binned_length_data: 0, // Not in EarthBank schema
      he_datapoints: parseInt(counts.he_datapoints as string, 10),
      he_grains: parseInt(counts.he_grains as string, 10),
    };

    return NextResponse.json(intCounts);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching table counts:');
    return NextResponse.json(
      { error: 'Failed to fetch table counts' },
      { status: 500 }
    );
  }
}
