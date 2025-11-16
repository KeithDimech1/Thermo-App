/**
 * Compare Page - Server Component Wrapper
 *
 * This server component wrapper prevents static generation issues
 * by explicitly marking the route as dynamic before rendering the client component.
 * Suspense boundary is required for useSearchParams() hook.
 */

import { Suspense } from 'react';
import CompareClient from './CompareClient';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <CompareClient />
    </Suspense>
  );
}
