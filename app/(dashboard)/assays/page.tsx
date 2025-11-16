/**
 * Assays List Page
 *
 * Browse all test configurations (assays) with pagination, filtering, and search
 */

export const dynamic = 'force-dynamic';

import { AssaysTable } from '@/components/AssaysTable';

export default async function AssaysPage({
  searchParams,
}: {
  searchParams: { dataset?: string };
}) {
  const dataset = (searchParams.dataset || 'curated') as 'curated' | 'all';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Assays</h1>
          <p className="text-gray-600 mt-2">
            Browse test configurations and performance metrics
          </p>
        </div>
      </div>

      {/* Interactive Table Component */}
      <AssaysTable dataset={dataset} />
    </div>
  );
}
