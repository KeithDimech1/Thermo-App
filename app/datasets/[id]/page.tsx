import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDatasetById } from '@/lib/db/queries';
import { query } from '@/lib/db/connection';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DatasetTabs from '@/components/datasets/DatasetTabs';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

interface DatasetStats {
  sample_count: number;
  aft_grain_count: number;
  ahe_grain_count: number;
}

// Helper to parse PostgreSQL array strings
function parsePostgresArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    return val
      .replace(/^\{/, '')
      .replace(/\}$/, '')
      .split(',')
      .map(s => s.replace(/^"/, '').replace(/"$/, '').trim());
  }
  return [];
}

async function getDatasetStats(datasetId: number): Promise<DatasetStats> {
  const sql = `
    SELECT
      COUNT(DISTINCT s.sample_id) as sample_count,
      COALESCE(SUM(s.n_aft_grains), 0) as aft_grain_count,
      COALESCE(SUM(s.n_ahe_grains), 0) as ahe_grain_count
    FROM samples s
    WHERE s.dataset_id = $1
  `;

  const results = await query<DatasetStats>(sql, [datasetId]);
  return results[0] || { sample_count: 0, aft_grain_count: 0, ahe_grain_count: 0 };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const datasetId = parseInt(id, 10);
  const dataset = await getDatasetById(datasetId);

  if (!dataset) {
    return {
      title: 'Dataset Not Found',
    };
  }

  return {
    title: `${dataset.dataset_name} - AusGeochem Thermochronology`,
    description: dataset.description || `Thermochronology dataset: ${dataset.dataset_name}`,
  };
}

export default async function DatasetOverviewPage({ params }: PageProps) {
  const { id } = await params;
  const datasetId = parseInt(id, 10);

  if (isNaN(datasetId)) {
    return notFound();
  }

  const dataset = await getDatasetById(datasetId);

  if (!dataset) {
    return notFound();
  }

  const stats = await getDatasetStats(datasetId);

  // Parse PostgreSQL array fields
  const authors = parsePostgresArray(dataset.authors);
  const analysisMethods = parsePostgresArray(dataset.analysis_methods);
  const keyFindings = parsePostgresArray(dataset.key_findings);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Datasets', href: '/datasets' },
        { label: dataset.dataset_name }
      ]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-4xl font-bold text-gray-900 flex-1">
            {dataset.dataset_name}
          </h1>

          {/* FAIR Score Badge */}
          {dataset.fair_score !== null && dataset.fair_score !== undefined && (
            <div className="ml-4 flex flex-col items-center">
              <div className={`
                text-5xl font-bold px-6 py-3 rounded-lg
                ${dataset.fair_score >= 90 ? 'bg-green-100 text-green-800' :
                  dataset.fair_score >= 75 ? 'bg-yellow-100 text-yellow-800' :
                  dataset.fair_score >= 60 ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'}
              `}>
                {dataset.fair_score}
              </div>
              <p className="text-xs text-gray-600 mt-1 font-semibold">FAIR Score</p>
            </div>
          )}
        </div>

        {/* Laboratory Badge */}
        {dataset.laboratory && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full mb-4">
            <span className="text-sm font-semibold text-gray-700">🏛️ Laboratory</span>
            <span className="text-sm text-gray-900">{dataset.laboratory}</span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <DatasetTabs datasetId={datasetId} activeTab="overview" />

      {/* Publication Information Card - Prominent at top */}
      <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-l-4 border-amber-600 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          📄 Publication Information
        </h2>

        {/* Full Citation */}
        {dataset.full_citation && (
          <div className="mb-4 p-4 bg-white rounded-md">
            <p className="text-sm font-semibold text-gray-700 mb-1">Citation</p>
            <p className="text-gray-900 italic">{dataset.full_citation}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Journal */}
          {dataset.publication_journal && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Journal</p>
              <p className="text-gray-900">{dataset.publication_journal}</p>
            </div>
          )}

          {/* Year */}
          {dataset.publication_year && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Year</p>
              <p className="text-gray-900">{dataset.publication_year}</p>
            </div>
          )}

          {/* Volume/Pages */}
          {dataset.publication_volume_pages && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Volume & Pages</p>
              <p className="text-gray-900">{dataset.publication_volume_pages}</p>
            </div>
          )}

          {/* DOI */}
          {dataset.doi && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">DOI</p>
              <a
                href={`https://doi.org/${dataset.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-700 hover:text-amber-900 underline break-all"
              >
                {dataset.doi}
              </a>
            </div>
          )}

          {/* Laboratory */}
          {dataset.laboratory && (
            <div className="md:col-span-2">
              <p className="text-sm font-semibold text-gray-700 mb-1">Laboratory</p>
              <p className="text-gray-900">{dataset.laboratory}</p>
            </div>
          )}
        </div>

        {/* PDF Link and Supplementary Materials */}
        {(dataset.pdf_url || dataset.supplementary_files_url) && (
          <div className="mt-4 pt-4 border-t border-amber-200 flex flex-wrap gap-3">
            {dataset.pdf_url && (
              <a
                href={dataset.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold"
              >
                📎 View Full PDF
              </a>
            )}
            {dataset.supplementary_files_url && (
              <a
                href={dataset.supplementary_files_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
              >
                📊 Supplementary Data
              </a>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {dataset.description && (
        <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <h2 className="text-lg font-bold text-blue-900 mb-3">Description</h2>
          <p className="text-gray-800 leading-relaxed">{dataset.description}</p>
        </div>
      )}

      {/* Study Area */}
      {dataset.study_location && (
        <div className="mb-8 p-6 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
          <h2 className="text-lg font-bold text-green-900 mb-3">🌍 Study Area</h2>
          <p className="text-gray-900">{dataset.study_location}</p>
        </div>
      )}

      {/* Key Findings */}
      {keyFindings.length > 0 && (
        <div className="mb-8 p-6 bg-purple-50 border-l-4 border-purple-500 rounded-r-lg">
          <h2 className="text-lg font-bold text-purple-900 mb-3">Key Findings</h2>
          <ul className="space-y-2">
            {keyFindings.map((finding, idx) => (
              <li key={idx} className="text-gray-800 flex items-start">
                <span className="text-purple-600 mr-2 font-bold">•</span>
                <span className="flex-1">{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Authors */}
        {authors.length > 0 && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">👤 Authors</p>
            <p className="text-sm text-gray-900">{authors.join(', ')}</p>
          </div>
        )}

        {/* Mineral Analyzed */}
        {dataset.mineral_analyzed && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">💎 Mineral Analyzed</p>
            <p className="text-sm text-gray-900">{dataset.mineral_analyzed}</p>
          </div>
        )}

        {/* Sample Count */}
        {dataset.sample_count && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">📊 Total Samples</p>
            <p className="text-sm text-gray-900">{dataset.sample_count}</p>
          </div>
        )}

        {/* Age Range */}
        {(dataset.age_range_min_ma || dataset.age_range_max_ma) && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">⏱️ Age Range</p>
            <p className="text-sm text-gray-900">
              {dataset.age_range_min_ma?.toFixed(1)}-{dataset.age_range_max_ma?.toFixed(1)} Ma
            </p>
          </div>
        )}

        {/* Collection Date */}
        {dataset.collection_date && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">📅 Collection Date</p>
            <p className="text-sm text-gray-900">
              {new Date(dataset.collection_date).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Analyst */}
        {dataset.analyst && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">👨‍🔬 Analyst</p>
            <p className="text-sm text-gray-900">{dataset.analyst}</p>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="flex flex-wrap gap-6 mb-8 p-6 bg-amber-50 rounded-lg border border-amber-200">
        <div>
          <p className="text-sm text-gray-600">Samples</p>
          <p className="text-3xl font-bold text-gray-900">{stats.sample_count}</p>
        </div>
        {stats.aft_grain_count > 0 && (
          <div>
            <p className="text-sm text-gray-600">AFT Grains</p>
            <p className="text-3xl font-bold text-green-700">{stats.aft_grain_count}</p>
          </div>
        )}
        {stats.ahe_grain_count > 0 && (
          <div>
            <p className="text-sm text-gray-600">AHe Grains</p>
            <p className="text-3xl font-bold text-blue-700">{stats.ahe_grain_count}</p>
          </div>
        )}
      </div>

      {/* Analysis Methods */}
      {analysisMethods.length > 0 && (
        <div className="mb-8">
          <p className="text-sm font-semibold text-gray-700 mb-3">Analysis Methods</p>
          <div className="flex flex-wrap gap-2">
            {analysisMethods.map((method, idx) => (
              <span
                key={idx}
                className="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* View Samples Link */}
      <div className="mt-8">
        <Link
          href="/samples"
          className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
        >
          🔬 View Sample Details →
        </Link>
      </div>
    </div>
  );
}
