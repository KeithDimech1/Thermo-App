/**
 * Filters API Route
 *
 * GET /api/filters - Get all filter options for the assays table
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllPathogens, getUniqueMarkers, getUniqueManufacturers, getUniqueAssaysWithPathogen } from '@/lib/db/queries';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Helper to extract abbreviation from pathogen name
function extractAbbreviation(name: string): string | null {
  const match = name.match(/\(([A-Z0-9-]+)\)/);
  return match?.[1] ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataset = (searchParams.get('dataset') || 'curated') as 'curated' | 'all';

    // Fetch all filter options in parallel
    const [pathogens, markers, manufacturers, assays] = await Promise.all([
      getAllPathogens(),
      getUniqueMarkers(dataset),
      getUniqueManufacturers(dataset),
      getUniqueAssaysWithPathogen(dataset),
    ]);

    // Add abbreviations to pathogens
    const pathogensWithAbbr = pathogens.map(p => ({
      ...p,
      abbreviation: extractAbbreviation(p.name) || p.name,
    }));

    return NextResponse.json({
      pathogens: pathogensWithAbbr,
      markers,
      manufacturers,
      assays,
    });
  } catch (error) {
    console.error('[Filters API] ERROR:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch filter options',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
