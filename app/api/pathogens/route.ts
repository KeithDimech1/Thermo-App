/**
 * Pathogens API Route
 *
 * GET /api/pathogens - Get all pathogens
 * GET /api/pathogens?abbr=CMV - Get pathogen by abbreviation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllPathogens, getPathogenByAbbreviation } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const abbreviation = searchParams.get('abbr');

    // If abbreviation provided, return specific pathogen
    if (abbreviation) {
      const pathogen = await getPathogenByAbbreviation(abbreviation);

      if (!pathogen) {
        return NextResponse.json(
          { error: 'Pathogen not found', abbreviation },
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: pathogen,
      });
    }

    // Otherwise return all pathogens
    const pathogens = await getAllPathogens();

    return NextResponse.json({
      data: pathogens,
      total: pathogens.length,
    });
  } catch (error) {
    console.error('[Pathogens API] ERROR:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch pathogens',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Add CORS headers for API
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
