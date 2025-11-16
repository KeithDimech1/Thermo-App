/**
 * Single Marker API Route
 *
 * GET /api/markers/[id] - Get marker by ID with all test configurations
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getMarkerById,
  getConfigsByMarkerId,
} from '@/lib/db/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const markerId = parseInt(params.id);

    if (isNaN(markerId)) {
      return NextResponse.json(
        { error: 'Invalid marker ID' },
        { status: 400 }
      );
    }

    // Get marker details
    const marker = await getMarkerById(markerId);

    if (!marker) {
      return NextResponse.json(
        { error: 'Marker not found' },
        { status: 404 }
      );
    }

    // Get all test configurations for this marker
    const configs = await getConfigsByMarkerId(markerId);

    return NextResponse.json({
      data: {
        marker,
        configs,
        totalConfigs: configs.length,
      },
    });
  } catch (error) {
    console.error(`API Error (GET /api/markers/${params.id}):`, error);

    return NextResponse.json(
      {
        error: 'Failed to fetch marker',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
