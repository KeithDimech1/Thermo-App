/**
 * API Route: Sample Age Data
 * Returns sample age data for visualization
 *
 * SCHEMA: EarthBank camelCase (IDEA-014)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { query } from '@/lib/db/connection';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const datasetId = searchParams.get('dataset_id');

    let sql = `
      SELECT
        s."sampleID",
        fd.id as datapoint_id,
        fd."datapointName",
        s."latitude",
        s."longitude",
        s."elevationM",
        fd."centralAgeMa",
        fd."centralAgeErrorMa",
        fd."pooledAgeMa",
        fd."pooledAgeErrorMa",
        fd."dispersionPct",
        fd."pChi2Pct" as p_chi2,
        fd."nGrains",
        fd."laboratory",
        fd."analysisDate"
      FROM earthbank_samples s
      JOIN "earthbank_ftDatapoints" fd ON s."sampleID" = fd."sampleID"
      WHERE fd."centralAgeMa" IS NOT NULL
    `;

    const params: any[] = [];

    if (datasetId) {
      sql += ` AND s."datasetID" = $1`;
      params.push(datasetId); // datasetID is now string, not integer
    }

    sql += ` ORDER BY fd."centralAgeMa"`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length
    });

  } catch (error: any) {
    logger.error({ err: error }, 'Error fetching age data:');
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
