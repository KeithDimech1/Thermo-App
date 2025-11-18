import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDatasetById, getFairScoreBreakdown } from '@/lib/db/queries';
import FairScoreCard from '@/components/datasets/FairScoreCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DatasetTabs from '@/components/datasets/DatasetTabs';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
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
    title: `FAIR Assessment - ${dataset.dataset_name} - AusGeochem`,
    description: `FAIR data compliance assessment for ${dataset.dataset_name}`,
  };
}

export default async function DatasetFairPage({ params }: PageProps) {
  const { id } = await params;
  const datasetId = parseInt(id, 10);

  if (isNaN(datasetId)) {
    return notFound();
  }

  const dataset = await getDatasetById(datasetId);

  if (!dataset) {
    return notFound();
  }

  const fairBreakdown = await getFairScoreBreakdown(datasetId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Datasets', href: '/datasets' },
        { label: dataset.dataset_name, href: `/datasets/${datasetId}` },
        { label: 'FAIR Assessment' }
      ]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {dataset.dataset_name}
            </h1>
            <p className="text-lg text-gray-600">FAIR Data Compliance Assessment</p>
          </div>

          {/* FAIR Score Badge */}
          {dataset.fair_score !== null && dataset.fair_score !== undefined && (
            <div className="ml-4 flex flex-col items-center">
              <div className={`
                text-6xl font-bold px-8 py-4 rounded-lg
                ${dataset.fair_score >= 90 ? 'bg-green-100 text-green-800' :
                  dataset.fair_score >= 75 ? 'bg-yellow-100 text-yellow-800' :
                  dataset.fair_score >= 60 ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'}
              `}>
                {dataset.fair_score}
              </div>
              <p className="text-sm text-gray-600 mt-2 font-semibold">Overall Score</p>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <DatasetTabs datasetId={datasetId} activeTab="fair" />

      {/* FAIR Principles Overview */}
      <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
        <h2 className="text-lg font-bold text-blue-900 mb-3">About FAIR Principles</h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          The FAIR principles ensure that data is <strong>Findable</strong>, <strong>Accessible</strong>,{' '}
          <strong>Interoperable</strong>, and <strong>Reusable</strong>. This assessment evaluates compliance
          with these principles based on the framework by Nixon et al. (2025) and reporting standards by Kohn et al. (2024).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Findable (25 points)</h3>
            <p className="text-gray-700">Data can be discovered through persistent identifiers, rich metadata, and indexing</p>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Accessible (25 points)</h3>
            <p className="text-gray-700">Data can be retrieved using standard protocols with clear access conditions</p>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Interoperable (25 points)</h3>
            <p className="text-gray-700">Data uses standardized formats and vocabularies for integration</p>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Reusable (25 points)</h3>
            <p className="text-gray-700">Data includes provenance, usage licenses, and domain-relevant standards</p>
          </div>
        </div>
      </div>

      {/* FAIR Score Card with Breakdown */}
      {dataset.fair_score !== null && dataset.fair_score !== undefined ? (
        <div className="mb-8">
          <FairScoreCard fairScore={dataset.fair_score} fairBreakdown={fairBreakdown} />
        </div>
      ) : (
        <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-gray-600">No FAIR assessment available for this dataset yet.</p>
        </div>
      )}

      {/* FAIR Reasoning */}
      {dataset.fair_reasoning && (
        <div className="mb-8 p-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
          <h2 className="text-lg font-bold text-amber-900 mb-3">Assessment Summary</h2>
          <p className="text-gray-800 leading-relaxed whitespace-pre-line">{dataset.fair_reasoning}</p>
        </div>
      )}

      {/* Kohn et al. (2024) Table Scores */}
      {fairBreakdown && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kohn et al. (2024) Reporting Standards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Table 4 Score */}
            {fairBreakdown.table4_score !== null && (
              <div className="p-6 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">Table 4: Geosample Metadata</h3>
                  <span className="text-2xl font-bold text-green-700">{fairBreakdown.table4_score}/15</span>
                </div>
                {fairBreakdown.table4_reasoning && (
                  <p className="text-sm text-gray-700">{fairBreakdown.table4_reasoning}</p>
                )}
              </div>
            )}

            {/* Table 5 Score */}
            {fairBreakdown.table5_score !== null && (
              <div className="p-6 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">Table 5: FT Counts</h3>
                  <span className="text-2xl font-bold text-green-700">{fairBreakdown.table5_score}/15</span>
                </div>
                {fairBreakdown.table5_reasoning && (
                  <p className="text-sm text-gray-700">{fairBreakdown.table5_reasoning}</p>
                )}
              </div>
            )}

            {/* Table 6 Score */}
            {fairBreakdown.table6_score !== null && (
              <div className="p-6 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">Table 6: Track Lengths</h3>
                  <span className="text-2xl font-bold text-green-700">{fairBreakdown.table6_score}/10</span>
                </div>
                {fairBreakdown.table6_reasoning && (
                  <p className="text-sm text-gray-700">{fairBreakdown.table6_reasoning}</p>
                )}
              </div>
            )}

            {/* Table 10 Score */}
            {fairBreakdown.table10_score !== null && (
              <div className="p-6 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">Table 10: Ages</h3>
                  <span className="text-2xl font-bold text-green-700">{fairBreakdown.table10_score}/10</span>
                </div>
                {fairBreakdown.table10_reasoning && (
                  <p className="text-sm text-gray-700">{fairBreakdown.table10_reasoning}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* References */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-3">References</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            <strong>Nixon et al. (2025)</strong> - "EarthBank: A FAIR platform for geological data"
            - <em>Chemical Geology</em>
          </li>
          <li>
            <strong>Kohn et al. (2024)</strong> - "Reporting standards for thermochronology data"
            - <em>GSA Bulletin</em>
          </li>
        </ul>
      </div>
    </div>
  );
}
