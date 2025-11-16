import Link from 'next/link';
import { Dataset } from '@/lib/types/thermo-data';

interface DatasetCardProps {
  dataset: Dataset;
  sampleCount?: number;
  aftGrainCount?: number;
  aheGrainCount?: number;
}

export default function DatasetCard({
  dataset,
  sampleCount = 0,
  aftGrainCount = 0,
  aheGrainCount = 0
}: DatasetCardProps) {
  return (
    <Link
      href={`/papers/${dataset.id}`}
      className="block bg-white shadow-md hover:shadow-xl transition-shadow rounded-lg p-6 border border-gray-200 hover:border-amber-400"
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {dataset.dataset_name}
        </h3>

        {/* Authors */}
        {dataset.authors && dataset.authors.length > 0 && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">👤 Authors:</span>{' '}
            {dataset.authors.join(', ')}
          </p>
        )}

        {/* Study Area */}
        {dataset.study_area && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">📍 Study Area:</span>{' '}
            {dataset.study_area}
          </p>
        )}

        {/* Laboratory */}
        {dataset.laboratory && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">🔬 Laboratory:</span>{' '}
            {dataset.laboratory}
          </p>
        )}

        {/* Collection Date */}
        {dataset.collection_date && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">📅 Collection:</span>{' '}
            {new Date(dataset.collection_date).getFullYear()}
          </p>
        )}
      </div>

      {/* Description */}
      {dataset.description && (
        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
          {dataset.description}
        </p>
      )}

      {/* Statistics */}
      <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-gray-200">
        {sampleCount > 0 && (
          <div className="text-sm">
            <span className="font-semibold text-gray-900">{sampleCount}</span>
            <span className="text-gray-600"> samples</span>
          </div>
        )}
        {aftGrainCount > 0 && (
          <div className="text-sm">
            <span className="font-semibold text-green-700">{aftGrainCount}</span>
            <span className="text-gray-600"> AFT grains</span>
          </div>
        )}
        {aheGrainCount > 0 && (
          <div className="text-sm">
            <span className="font-semibold text-blue-700">{aheGrainCount}</span>
            <span className="text-gray-600"> AHe grains</span>
          </div>
        )}
      </div>

      {/* Analysis Methods */}
      {dataset.analysis_methods && dataset.analysis_methods.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Analysis Methods:</p>
          <div className="flex flex-wrap gap-2">
            {dataset.analysis_methods.map((method, idx) => (
              <span
                key={idx}
                className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* DOI */}
      {dataset.doi && (
        <p className="text-xs text-gray-500 mb-4">
          <span className="font-semibold">DOI:</span> {dataset.doi}
        </p>
      )}

      {/* View Details Link */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <span className="text-amber-700 font-semibold text-sm hover:text-amber-900">
          View Details & Download Data →
        </span>
      </div>
    </Link>
  );
}
