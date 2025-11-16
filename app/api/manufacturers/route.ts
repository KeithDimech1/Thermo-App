/**
 * Manufacturers API Route
 *
 * GET /api/manufacturers - Get all manufacturers with performance data
 * Query Parameters:
 * - dataset: Filter by dataset (curated|all) - default: curated
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllManufacturers } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataset = searchParams.get('dataset') || 'curated';

    console.log('[Manufacturers API] Request received:', {
      dataset,
      hasDBUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    });

    const manufacturers = await getAllManufacturers(dataset as 'curated' | 'all');

    console.log('[Manufacturers API] Success:', {
      count: manufacturers.length,
      dataset,
    });

    return NextResponse.json({
      data: manufacturers,
      total: manufacturers.length,
    });
  } catch (error) {
    console.error('[Manufacturers API] ERROR:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      hasDBUrl: !!process.env.DATABASE_URL,
      dataset: request.nextUrl.searchParams.get('dataset'),
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch manufacturers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
