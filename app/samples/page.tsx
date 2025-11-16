import Link from 'next/link';
import { getAllSamples } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export default async function SamplesPage() {
  const { data: samples, total } = await getAllSamples({}, 100, 0, 'sample_id', 'asc');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-amber-700 hover:text-amber-900 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Geological Samples</h1>
          <p className="text-gray-600">
            {total} samples from the Malawi Rift Central Basin
          </p>
        </div>

        {/* Samples Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {samples.map((sample) => (
            <Link
              key={sample.sample_id}
              href={`/samples/${sample.sample_id}`}
              className="card bg-white shadow-md hover:shadow-lg transition-shadow"
            >
              {/* Sample Header */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900">{sample.sample_id}</h3>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                  {sample.mineral_type || 'Apatite'}
                </span>
              </div>

              {/* Analysis Method */}
              {sample.analysis_method && (
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-semibold">Method:</span> {sample.analysis_method}
                </p>
              )}

              {/* Data Availability */}
              <div className="flex gap-3 mb-3">
                {sample.n_aft_grains && sample.n_aft_grains > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-green-600">✓</span>
                    <span className="text-gray-700">{sample.n_aft_grains} AFT</span>
                  </div>
                )}
                {sample.n_ahe_grains && sample.n_ahe_grains > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-blue-600">✓</span>
                    <span className="text-gray-700">{sample.n_ahe_grains} AHe</span>
                  </div>
                )}
              </div>

              {/* Location */}
              {sample.sampling_location_information && (
                <p className="text-xs text-gray-500 mb-2">
                  📍 {sample.sampling_location_information}
                </p>
              )}

              {/* Lithology */}
              {sample.lithology && (
                <p className="text-xs text-gray-500">
                  🪨 {sample.lithology}
                </p>
              )}

              {/* View Details Link */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <span className="text-amber-700 font-semibold text-sm">
                  View Details →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {samples.length === 0 && (
          <div className="card text-center py-12 bg-white">
            <p className="text-gray-600">No samples found</p>
          </div>
        )}
      </div>
    </div>
  );
}
