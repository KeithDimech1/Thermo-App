/**
 * Compare API Route
 *
 * POST /api/compare
 * Body: { configIds: number[] }
 *
 * Returns comparison data with full context including methodology warnings
 */

import { NextRequest, NextResponse } from 'next/server';
import { compareConfigsWithContext } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configIds } = body;

    // Validate input
    if (!Array.isArray(configIds) || configIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 configuration IDs required' },
        { status: 400 }
      );
    }

    if (configIds.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 configurations can be compared' },
        { status: 400 }
      );
    }

    // Fetch comparison data
    const configs = await compareConfigsWithContext(configIds);

    if (!configs || configs.length === 0) {
      return NextResponse.json({ error: 'No configurations found' }, { status: 404 });
    }

    return NextResponse.json({
      configs,
      count: configs.length,
      methodology_warning: configs[0]?.methodology_warning || '',
      comparison_notes: configs[0]?.comparison_notes || '',
    });
  } catch (error) {
    console.error('Comparison API error:', error);
    return NextResponse.json(
      { error: 'Failed to compare configurations' },
      { status: 500 }
    );
  }
}
