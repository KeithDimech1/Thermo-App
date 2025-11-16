/**
 * API Route: /api/samples/[id]
 *
 * Get complete details for a single sample including:
 * - Sample metadata
 * - Fission-track count data
 * - Track length data
 * - Age data
 * - (U-Th)/He grain data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSampleDetail } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sampleId = params.id;

    if (!sampleId) {
      return NextResponse.json(
        { error: 'Sample ID is required' },
        { status: 400 }
      );
    }

    const sampleDetail = await getSampleDetail(sampleId);

    if (!sampleDetail) {
      return NextResponse.json(
        { error: 'Sample not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(sampleDetail);
  } catch (error) {
    console.error('Error fetching sample detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sample detail', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
