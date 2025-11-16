/**
 * Markers API Route
 *
 * GET /api/markers - Get all markers (optionally grouped by category)
 *
 * Query Parameters:
 * - grouped: Return markers grouped by category (true|false, default: false)
 * - search: Search markers by name
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllMarkers,
  getMarkersByCategory,
  searchMarkers,
} from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const grouped = searchParams.get('grouped') === 'true';
    const searchTerm = searchParams.get('search');

    // Search markers
    if (searchTerm) {
      const markers = await searchMarkers(searchTerm);
      return NextResponse.json({
        data: markers,
        total: markers.length,
      });
    }

    // Get markers grouped by category
    if (grouped) {
      const markersByCategory = await getMarkersByCategory();
      return NextResponse.json({
        data: markersByCategory,
      });
    }

    // Get all markers (flat list)
    const markers = await getAllMarkers();
    return NextResponse.json({
      data: markers,
      total: markers.length,
    });
  } catch (error) {
    console.error('API Error (GET /api/markers):', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch markers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
