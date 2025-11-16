import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

export const dynamic = 'force-dynamic';

interface SearchResult {
  type: 'marker' | 'manufacturer' | 'assay';
  id: number;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');

    if (!q || q.trim().length < 2) {
      return NextResponse.json({
        results: [],
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchTerm = `%${q.trim().toLowerCase()}%`;

    // Search markers
    const markersQuery = `
      SELECT
        m.id,
        m.name,
        m.antibody_type,
        p.name as pathogen_name,
        c.name as category_name,
        m.clinical_use
      FROM markers m
      LEFT JOIN pathogens p ON m.pathogen_id = p.id
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE LOWER(m.name) LIKE $1
         OR LOWER(m.antibody_type) LIKE $1
         OR LOWER(p.name) LIKE $1
      LIMIT 10;
    `;

    const markers = await query<any>(markersQuery, [searchTerm]);

    // Search manufacturers
    const manufacturersQuery = `
      SELECT
        id,
        name,
        country
      FROM manufacturers
      WHERE LOWER(name) LIKE $1
      LIMIT 10;
    `;

    const manufacturers = await query<any>(manufacturersQuery, [searchTerm]);

    // Search assays
    const assaysQuery = `
      SELECT
        a.id,
        a.name,
        a.platform,
        a.methodology,
        m.name as manufacturer_name
      FROM assays a
      LEFT JOIN manufacturers m ON a.manufacturer_id = m.id
      WHERE LOWER(a.name) LIKE $1
         OR LOWER(a.platform) LIKE $1
         OR LOWER(a.methodology) LIKE $1
      LIMIT 10;
    `;

    const assays = await query<any>(assaysQuery, [searchTerm]);

    // Format results
    const results: SearchResult[] = [
      ...markers.map(m => ({
        type: 'marker' as const,
        id: m.id,
        name: m.name,
        description: m.pathogen_name || m.category_name || '',
        metadata: {
          antibody_type: m.antibody_type,
          pathogen: m.pathogen_name,
          category: m.category_name,
          clinical_use: m.clinical_use
        }
      })),
      ...manufacturers.map(m => ({
        type: 'manufacturer' as const,
        id: m.id,
        name: m.name,
        description: m.country || '',
        metadata: {
          country: m.country
        }
      })),
      ...assays.map(a => ({
        type: 'assay' as const,
        id: a.id,
        name: a.name,
        description: `${a.manufacturer_name || ''} ${a.platform || ''}`.trim(),
        metadata: {
          platform: a.platform,
          methodology: a.methodology,
          manufacturer: a.manufacturer_name
        }
      }))
    ];

    return NextResponse.json({
      results,
      total: results.length,
      query: q
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
