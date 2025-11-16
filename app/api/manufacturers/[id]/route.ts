/**
 * Single Manufacturer API Route
 *
 * GET /api/manufacturers/[id] - Get manufacturer by ID with performance data and assays
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getManufacturerById,
  getAssaysByManufacturerId,
  getConfigsByManufacturerId,
} from '@/lib/db/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const manufacturerId = parseInt(params.id);

    if (isNaN(manufacturerId)) {
      return NextResponse.json(
        { error: 'Invalid manufacturer ID' },
        { status: 400 }
      );
    }

    // Get manufacturer with performance data
    const manufacturer = await getManufacturerById(manufacturerId);

    if (!manufacturer) {
      return NextResponse.json(
        { error: 'Manufacturer not found' },
        { status: 404 }
      );
    }

    // Get manufacturer's assays
    const assays = await getAssaysByManufacturerId(manufacturerId);

    // Get manufacturer's test configurations
    const configs = await getConfigsByManufacturerId(manufacturerId);

    return NextResponse.json({
      data: {
        manufacturer,
        assays,
        configs,
      },
    });
  } catch (error) {
    console.error(`API Error (GET /api/manufacturers/${params.id}):`, error);

    return NextResponse.json(
      {
        error: 'Failed to fetch manufacturer',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
