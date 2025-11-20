import Link from 'next/link';
import { EarthBankDataset } from '@/lib/types/earthbank-types';

// MIGRATED TO EARTHBANK SCHEMA - IDEA-014 Session 11
interface DatasetCardProps {
  dataset: EarthBankDataset;
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
  const analysisMethods = parsePostgresArray(dataset.analysisMethods);

  return (
    <Link
      href={`/datasets/${dataset.id}`}
      className="block bg-white shadow-md hover:shadow-xl transition-shadow rounded-lg p-6 border border-gray-200 hover:border-amber-400"
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {dataset.datasetName}
        </h3>

        {/* Laboratory */}
        {dataset.laboratory && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">Laboratory:</span>{' '}
            {dataset.laboratory}
          </p>
        )}

        {/* Publication info */}
        {(dataset.publicationYear || dataset.publicationJournal) && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">Publication:</span>{' '}
            {dataset.publicationJournal}
            {dataset.publicationYear && ` (${dataset.publicationYear})`}
            {dataset.publicationVolumePages && `, ${dataset.publicationVolumePages}`}
          </p>
        )}

        {/* Full Citation (if available and different from constructed one) */}
        {dataset.fullCitation && (
          <p className="text-xs text-gray-500 italic mb-2 line-clamp-2">
            {dataset.fullCitation}
          </p>
        )}

        {/* Authors */}
        {authors.length > 0 && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">Authors:</span>{' '}
            <span className="italic">
              {authors.slice(0, 3).join(', ')}
              {authors.length > 3 && ' et al.'}
            </span>
          </p>
        )}

        {/* Study Location */}
        {dataset.studyLocation && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">Location:</span>{' '}
            {dataset.studyLocation}
          </p>
        )}

        {/* Mineral & Sample Count */}
        <div className="flex gap-4 text-sm text-gray-600 mb-1">
          {dataset.mineralAnalyzed && (
            <span>
              <span className="font-semibold">Mineral:</span> {dataset.mineralAnalyzed}
            </span>
          )}
        </div>

        {/* Age Range */}
        {(dataset.ageRangeMinMa || dataset.ageRangeMaxMa) && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">Age Range:</span>{' '}
            {dataset.ageRangeMinMa !== null && dataset.ageRangeMinMa?.toFixed(1)}-
            {dataset.ageRangeMaxMa !== null && dataset.ageRangeMaxMa?.toFixed(1)} Ma
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
      {(sampleCount > 0 || aftGrainCount > 0 || aheGrainCount > 0) && (
        <div className="mb-4">
          <p className="text-sm text-gray-700">
            {sampleCount > 0 && (
              <span>
                <span className="font-semibold">{sampleCount}</span> samples
              </span>
            )}
            {aftGrainCount > 0 && (
              <span>
                {sampleCount > 0 && '    '}
                <span className="font-semibold">{aftGrainCount}</span> AFT grains
              </span>
            )}
            {aheGrainCount > 0 && (
              <span>
                {(sampleCount > 0 || aftGrainCount > 0) && '    '}
                <span className="font-semibold">{aheGrainCount}</span> AHe grains
              </span>
            )}
          </p>
        </div>
      )}

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

      {/* FAIR Score Badge - Note: fair_score not in datasets table, use FAIR Assessment page instead */}

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
