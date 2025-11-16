/**
 * Single Test Configuration API Route
 *
 * GET /api/configs/[id] - Get test configuration by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConfigById } from '@/lib/db/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = parseInt(params.id);

    if (isNaN(configId)) {
      return NextResponse.json(
        { error: 'Invalid configuration ID' },
        { status: 400 }
      );
    }

    const config = await getConfigById(configId);

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: config,
    });
  } catch (error) {
    console.error(`API Error (GET /api/configs/${params.id}):`, error);

    return NextResponse.json(
      {
        error: 'Failed to fetch configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
