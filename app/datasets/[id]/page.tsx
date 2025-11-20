import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDatasetById } from '@/lib/db/earthbank-queries';
import { query } from '@/lib/db/connection';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DatasetTabs from '@/components/datasets/DatasetTabs';
import SupplementaryFilesSection from '@/components/datasets/SupplementaryFilesSection';
import { extractPaperTitle } from '@/lib/utils/extract-paper-title';

export const dynamic = 'force-dynamic';

// MIGRATED TO EARTHBANK SCHEMA (camelCase)
interface PageProps {
  params: {
    id: string;
  };
}

interface DatasetStats {
  sampleCount: number;
  aftGrainCount: number;
  aheGrainCount: number;
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

async function getDatasetStats(datasetID: string): Promise<DatasetStats> {
  const sql = `
    SELECT
      COUNT(DISTINCT s."sampleID") as sample_count,
      COALESCE(SUM(s."nAFTGrains"), 0) as aft_grain_count,
      COALESCE(SUM(s."nAHeGrains"), 0) as ahe_grain_count
    FROM earthbank_samples s
    WHERE s."datasetID" = $1
  `;

  const results = await query<{sample_count: string; aft_grain_count: string; ahe_grain_count: string}>(sql, [datasetID]);
  const row = results[0];
  return row ? {
    sampleCount: parseInt(row.sample_count, 10),
    aftGrainCount: parseInt(row.aft_grain_count, 10),
    aheGrainCount: parseInt(row.ahe_grain_count, 10)
  } : { sampleCount: 0, aftGrainCount: 0, aheGrainCount: 0 };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const dataset = await getDatasetById(id);

  if (!dataset) {
    return {
      title: 'Dataset Not Found',
    };
  }

  return {
    title: `${dataset.datasetName} - AusGeochem Thermochronology`,
    description: dataset.description || `Thermochronology dataset: ${dataset.datasetName}`,
  };
}

export default async function DatasetOverviewPage({ params }: PageProps) {
  const { id } = await params;

  const dataset = await getDatasetById(id);

  if (!dataset) {
    return notFound();
  }

  const stats = await getDatasetStats(id);

  // Parse PostgreSQL array fields
  const authors = parsePostgresArray(dataset.authors);
  const analysisMethods = parsePostgresArray(dataset.analysisMethods);

  // Extract paper title from full citation
  const paperTitle = extractPaperTitle(dataset.fullCitation);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Datasets', href: '/datasets' },
        { label: dataset.datasetName }
      ]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900">
              {dataset.datasetName}
            </h1>
            {paperTitle && (
              <h2 className="text-xl font-bold text-gray-700 mt-2">
                {paperTitle}
              </h2>
            )}
          </div>

          {/* FAIR Score Badge - Note: Not in datasets table, use FAIR Assessment tab */}
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
      <DatasetTabs datasetId={id} activeTab="overview" />

      {/* Publication Information Card - Prominent at top */}
      <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-l-4 border-amber-600 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          📄 Publication Information
        </h2>

        {/* Full Citation */}
        {dataset.fullCitation && (
          <div className="mb-4 p-4 bg-white rounded-md">
            <p className="text-sm font-semibold text-gray-700 mb-1">Citation</p>
            <p className="text-gray-900 italic">{dataset.fullCitation}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Journal */}
          {dataset.publicationJournal && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Journal</p>
              <p className="text-gray-900">{dataset.publicationJournal}</p>
            </div>
          )}

          {/* Year */}
          {dataset.publicationYear && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Year</p>
              <p className="text-gray-900">{dataset.publicationYear}</p>
            </div>
          )}

          {/* Volume/Pages */}
          {dataset.publicationVolumePages && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Volume & Pages</p>
              <p className="text-gray-900">{dataset.publicationVolumePages}</p>
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
        {(dataset.pdfUrl || dataset.supplementaryFilesUrl) && (
          <div className="mt-4 pt-4 border-t border-amber-200 flex flex-wrap gap-3">
            {dataset.pdfUrl && (
              <a
                href={dataset.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold"
              >
                📎 View Full PDF
              </a>
            )}
            {dataset.supplementaryFilesUrl && (
              <a
                href={dataset.supplementaryFilesUrl}
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

      {/* Supplementary Files Section */}
      <SupplementaryFilesSection
        datasetId={id}
        supplementaryFilesUrl={dataset.supplementaryFilesUrl}
      />

      {/* Description */}
      {dataset.description && (
        <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <h2 className="text-lg font-bold text-blue-900 mb-3">Description</h2>
          <p className="text-gray-800 leading-relaxed">{dataset.description}</p>
        </div>
      )}

      {/* Study Area */}
      {dataset.studyLocation && (
        <div className="mb-8 p-6 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
          <h2 className="text-lg font-bold text-green-900 mb-3">🌍 Study Area</h2>
          <p className="text-gray-900">{dataset.studyLocation}</p>
        </div>
      )}

      {/* Key Findings - Note: Not in datasets table */}

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
        {dataset.mineralAnalyzed && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">💎 Mineral Analyzed</p>
            <p className="text-sm text-gray-900">{dataset.mineralAnalyzed}</p>
          </div>
        )}

        {/* Sample Count */}
        {dataset.sampleCount && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">📊 Total Samples</p>
            <p className="text-sm text-gray-900">{dataset.sampleCount}</p>
          </div>
        )}

        {/* Age Range */}
        {(dataset.ageRangeMinMa || dataset.ageRangeMaxMa) && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">⏱️ Age Range</p>
            <p className="text-sm text-gray-900">
              {dataset.ageRangeMinMa?.toFixed(1)}-{dataset.ageRangeMaxMa?.toFixed(1)} Ma
            </p>
          </div>
        )}

        {/* Collection Date */}
        {dataset.collectionDate && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">📅 Collection Date</p>
            <p className="text-sm text-gray-900">
              {new Date(dataset.collectionDate).toLocaleDateString()}
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
          <p className="text-3xl font-bold text-gray-900">{stats.sampleCount}</p>
        </div>
        {stats.aftGrainCount > 0 && (
          <div>
            <p className="text-sm text-gray-600">AFT Grains</p>
            <p className="text-3xl font-bold text-green-700">{stats.aftGrainCount}</p>
          </div>
        )}
        {stats.aheGrainCount > 0 && (
          <div>
            <p className="text-sm text-gray-600">AHe Grains</p>
            <p className="text-3xl font-bold text-blue-700">{stats.aheGrainCount}</p>
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
