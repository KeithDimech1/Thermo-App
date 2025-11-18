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
  // Parse authors if it's a PostgreSQL array string
  const parsePostgresArray = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      // Remove { and }, then split by comma and clean quotes
      return val
        .replace(/^\{/, '')
        .replace(/\}$/, '')
        .split(',')
        .map(s => s.replace(/^"/, '').replace(/"$/, '').trim());
    }
    return [];
  };

  const authors = parsePostgresArray(dataset.authors);
  const analysisMethods = parsePostgresArray(dataset.analysis_methods);

  return (
    <Link
      href={`/datasets/${dataset.id}`}
      className="block bg-white shadow-md hover:shadow-xl transition-shadow rounded-lg p-6 border border-gray-200 hover:border-amber-400"
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {dataset.dataset_name}
        </h3>

        {/* Laboratory */}
        {dataset.laboratory && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">🏛️ Laboratory:</span>{' '}
            {dataset.laboratory}
          </p>
        )}

        {/* Publication info */}
        {(dataset.publication_year || dataset.publication_journal) && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">📄 Publication:</span>{' '}
            {dataset.publication_journal}
            {dataset.publication_year && ` (${dataset.publication_year})`}
            {dataset.publication_volume_pages && `, ${dataset.publication_volume_pages}`}
          </p>
        )}

        {/* Full Citation (if available and different from constructed one) */}
        {dataset.full_citation && (
          <p className="text-xs text-gray-500 italic mb-2 line-clamp-2">
            {dataset.full_citation}
          </p>
        )}

        {/* Authors */}
        {authors.length > 0 && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">👤 Authors:</span>{' '}
            {authors.slice(0, 3).join(', ')}
            {authors.length > 3 && ` et al.`}
          </p>
        )}

        {/* Study Location */}
        {dataset.study_location && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">📍 Location:</span>{' '}
            {dataset.study_location}
          </p>
        )}

        {/* Mineral & Sample Count */}
        <div className="flex gap-4 text-sm text-gray-600 mb-1">
          {dataset.mineral_analyzed && (
            <span>
              <span className="font-semibold">🔬 Mineral:</span> {dataset.mineral_analyzed}
            </span>
          )}
          {dataset.sample_count && (
            <span>
              <span className="font-semibold">📊 Samples:</span> {dataset.sample_count}
            </span>
          )}
        </div>

        {/* Age Range */}
        {(dataset.age_range_min_ma || dataset.age_range_max_ma) && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">⏱️ Age Range:</span>{' '}
            {dataset.age_range_min_ma !== null && dataset.age_range_min_ma.toFixed(1)}-
            {dataset.age_range_max_ma !== null && dataset.age_range_max_ma.toFixed(1)} Ma
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
      {analysisMethods.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Analysis Methods:</p>
          <div className="flex flex-wrap gap-2">
            {analysisMethods.map((method, idx) => (
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

      {/* FAIR Score Badge */}
      {dataset.fair_score && (
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <span className="text-xs font-semibold text-gray-700">FAIR Score:</span>
            <span className={`text-lg font-bold ${
              dataset.fair_score >= 90 ? 'text-green-600' :
              dataset.fair_score >= 80 ? 'text-blue-600' :
              dataset.fair_score >= 70 ? 'text-yellow-600' :
              'text-orange-600'
            }`}>
              {dataset.fair_score}/100
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              dataset.fair_score >= 90 ? 'bg-green-100 text-green-800' :
              dataset.fair_score >= 80 ? 'bg-blue-100 text-blue-800' :
              dataset.fair_score >= 70 ? 'bg-yellow-100 text-yellow-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {dataset.fair_score >= 90 ? 'A' :
               dataset.fair_score >= 80 ? 'B' :
               dataset.fair_score >= 70 ? 'C' : 'D'}
            </span>
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
