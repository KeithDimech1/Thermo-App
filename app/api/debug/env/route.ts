/**
 * Debug endpoint to check environment variables on Vercel
 * DELETE THIS FILE after debugging!
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  return NextResponse.json({
    env: process.env.NODE_ENV,
    supabase: {
      url: supabaseUrl || 'MISSING',
      urlLength: supabaseUrl?.length || 0,
      keyExists: !!supabaseKey,
      keyLength: supabaseKey?.length || 0,
      keyFirst20: supabaseKey?.substring(0, 20) || 'MISSING',
      keyLast10: supabaseKey ? `***${supabaseKey.slice(-10)}` : 'MISSING',
      // Check for whitespace issues
      hasLeadingSpace: supabaseKey ? supabaseKey !== supabaseKey.trimStart() : false,
      hasTrailingSpace: supabaseKey ? supabaseKey !== supabaseKey.trimEnd() : false,
      parts: supabaseKey?.split('.').length || 0,
    },
    database: {
      urlExists: !!databaseUrl,
      urlFirst50: databaseUrl?.substring(0, 50) || 'MISSING',
    }
  });
}
