/**
 * API Route: Sample Age Data
 * Returns sample age data for visualization
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const datasetId = searchParams.get('dataset_id');

    let sql = `
      SELECT
        s.sample_id,
        fd.id as datapoint_id,
        fd.datapoint_key,
        s.latitude,
        s.longitude,
        s.elevation_m,
        fd.central_age_ma,
        fd.central_age_error_ma,
        fd.pooled_age_ma,
        fd.pooled_age_error_ma,
        fd.dispersion_pct,
        fd.P_chi2_pct as p_chi2,
        fd.n_grains,
        fd.laboratory,
        fd.analysis_date
      FROM samples s
      JOIN ft_datapoints fd ON s.sample_id = fd.sample_id
      WHERE fd.central_age_ma IS NOT NULL
    `;

    const params: any[] = [];

    if (datasetId) {
      sql += ` AND s.dataset_id = $1`;
      params.push(parseInt(datasetId));
    }

    sql += ` ORDER BY fd.central_age_ma`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length
    });

  } catch (error: any) {
    console.error('Error fetching age data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
