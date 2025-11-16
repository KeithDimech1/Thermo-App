import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getDatasetById,
  getDataFilesByDataset,
  getDatasetTotalFileSize
} from '@/lib/db/queries';
import { query } from '@/lib/db/connection';
import DownloadSection from '@/components/datasets/DownloadSection';
import Breadcrumb from '@/components/ui/Breadcrumb';

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
    // Remove { and }, then split by comma and clean quotes
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

  const rows = await query<{
    sample_count: string;
    aft_grain_count: string;
    ahe_grain_count: string;
  }>(sql, [datasetId]);

  if (rows.length === 0 || !rows[0]) {
    return { sample_count: 0, aft_grain_count: 0, ahe_grain_count: 0 };
  }

  const row = rows[0];
  return {
    sample_count: parseInt(row.sample_count, 10),
    aft_grain_count: parseInt(row.aft_grain_count, 10),
    ahe_grain_count: parseInt(row.ahe_grain_count, 10)
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const datasetId = parseInt(params.id, 10);
  const dataset = await getDatasetById(datasetId);

  if (!dataset) {
    return {
      title: 'Dataset Not Found'
    };
  }

  return {
    title: `${dataset.dataset_name} - Datasets`,
    description: dataset.description || `Thermochronology data for ${dataset.dataset_name}`
  };
}

export default async function PaperDetailPage({ params }: PageProps) {
  const datasetId = parseInt(params.id, 10);

  if (isNaN(datasetId)) {
    notFound();
  }

  const dataset = await getDatasetById(datasetId);

  if (!dataset) {
    notFound();
  }

  const [files, totalSize, stats] = await Promise.all([
    getDataFilesByDataset(datasetId),
    getDatasetTotalFileSize(datasetId),
    getDatasetStats(datasetId)
  ]);

  // Parse PostgreSQL array fields
  const authors = parsePostgresArray(dataset.authors);
  const analysisMethods = parsePostgresArray(dataset.analysis_methods);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Datasets', href: '/datasets' },
        { label: dataset.dataset_name }
      ]} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {dataset.dataset_name}
        </h1>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Authors */}
          {authors.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">👤 Authors</p>
              <p className="text-sm text-gray-900">{authors.join(', ')}</p>
            </div>
          )}

          {/* Study Area */}
          {dataset.study_area && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">📍 Study Area</p>
              <p className="text-sm text-gray-900">{dataset.study_area}</p>
            </div>
          )}

          {/* Laboratory */}
          {dataset.laboratory && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">🔬 Laboratory</p>
              <p className="text-sm text-gray-900">{dataset.laboratory}</p>
            </div>
          )}

          {/* Collection Date */}
          {dataset.collection_date && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">📅 Collection Date</p>
              <p className="text-sm text-gray-900">
                {new Date(dataset.collection_date).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* DOI */}
          {dataset.doi && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">📖 DOI</p>
              <a
                href={`https://doi.org/${dataset.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-amber-700 hover:text-amber-900 underline"
              >
                {dataset.doi}
              </a>
            </div>
          )}

          {/* Analyst */}
          {dataset.analyst && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">🔬 Analyst</p>
              <p className="text-sm text-gray-900">{dataset.analyst}</p>
            </div>
          )}
        </div>

        {/* Description */}
        {dataset.description && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{dataset.description}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="flex flex-wrap gap-6 mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div>
            <p className="text-sm text-gray-600">Samples</p>
            <p className="text-2xl font-bold text-gray-900">{stats.sample_count}</p>
          </div>
          {stats.aft_grain_count > 0 && (
            <div>
              <p className="text-sm text-gray-600">AFT Grains</p>
              <p className="text-2xl font-bold text-green-700">{stats.aft_grain_count}</p>
            </div>
          )}
          {stats.ahe_grain_count > 0 && (
            <div>
              <p className="text-sm text-gray-600">AHe Grains</p>
              <p className="text-2xl font-bold text-blue-700">{stats.ahe_grain_count}</p>
            </div>
          )}
        </div>

        {/* Analysis Methods */}
        {analysisMethods.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Analysis Methods</p>
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
      </div>

      {/* Download Section */}
      <DownloadSection files={files} datasetId={datasetId} totalSize={totalSize} />

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
