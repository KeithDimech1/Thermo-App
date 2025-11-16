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
        s.latitude,
        s.longitude,
        s.elevation_m,
        fa.central_age_ma,
        fa.central_age_error_ma,
        fa.pooled_age_ma,
        fa.pooled_age_error_ma,
        fa.dispersion_pct,
        fa.p_chi2,
        fa.n_grains
      FROM samples s
      JOIN ft_ages fa ON s.sample_id = fa.sample_id
      WHERE fa.central_age_ma IS NOT NULL
    `;

    const params: any[] = [];

    if (datasetId) {
      sql += ` AND s.dataset_id = $1`;
      params.push(parseInt(datasetId));
    }

    sql += ` ORDER BY fa.central_age_ma`;

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
