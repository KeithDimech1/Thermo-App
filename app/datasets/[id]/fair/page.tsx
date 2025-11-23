import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDatasetById } from '@/lib/db/earthbank-queries';
// NOTE: getFairScoreBreakdown uses old queries.ts since fair_score_breakdown table was not migrated to EarthBank schema
import { getFairScoreBreakdown } from '@/lib/db/queries';
import { loadFairCompliance, KOHN_TABLE_DESCRIPTIONS, getFairScoreColor, getGradeBadgeColor } from '@/lib/db/fair-compliance';
import FairScoreCard from '@/components/datasets/FairScoreCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DatasetTabs from '@/components/datasets/DatasetTabs';
import Tooltip from '@/components/ui/Tooltip';
import FairAnalysisButton from '@/components/datasets/FairAnalysisButton';

export const dynamic = 'force-dynamic';

// MIGRATED TO EARTHBANK SCHEMA - IDEA-014 Session 11
interface PageProps {
  params: {
    id: string;
  };
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
    title: `FAIR Assessment - ${dataset.datasetName} - AusGeochem`,
    description: `FAIR data compliance assessment for ${dataset.datasetName}`,
  };
}

export default async function DatasetFairPage({ params }: PageProps) {
  const { id } = await params;

  const dataset = await getDatasetById(id);

  if (!dataset) {
    return notFound();
  }

  // Note: fair_score_breakdown table still uses old schema (dataset_id as integer)
  // Convert string UUID back to integer for this legacy table
  const datasetIdInt = parseInt(id, 10);
  const fairBreakdown = await getFairScoreBreakdown(datasetIdInt);

  // Load fair-compliance.json (if available)
  const fairCompliance = await loadFairCompliance(dataset.datasetName);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Datasets', href: '/datasets' },
        { label: dataset.datasetName, href: `/datasets/${id}` },
        { label: 'FAIR Assessment' }
      ]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ThermoFAIR: {dataset.datasetName}
            </h1>
            <p className="text-lg text-gray-600">FAIR Data Compliance Assessment</p>
          </div>

          {/* FAIR Score Badge */}
          {fairBreakdown && (
            <div className="ml-4 flex flex-col items-center">
              <div className={`
                text-6xl font-bold px-8 py-4 rounded-lg
                ${fairBreakdown.total_score && fairBreakdown.total_score >= 90 ? 'bg-green-100 text-green-800' :
                  fairBreakdown.total_score && fairBreakdown.total_score >= 70 ? 'bg-blue-100 text-blue-800' :
                  fairBreakdown.total_score && fairBreakdown.total_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-orange-100 text-orange-800'}
              `}>
                {fairBreakdown.total_score}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-sm text-gray-600 font-semibold">Overall Score</p>
                {fairBreakdown.grade && (
                  <span className={`
                    px-3 py-1 rounded-full text-sm font-bold
                    ${fairBreakdown.grade === 'A' ? 'bg-green-600 text-white' :
                      fairBreakdown.grade === 'B' ? 'bg-blue-600 text-white' :
                      fairBreakdown.grade === 'C' ? 'bg-yellow-600 text-white' :
                      fairBreakdown.grade === 'D' ? 'bg-orange-600 text-white' :
                      'bg-red-600 text-white'}
                  `}>
                    Grade {fairBreakdown.grade}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <DatasetTabs datasetId={id} activeTab="fair" />

      {/* Analysis Button */}
      <div className="mb-8">
        <FairAnalysisButton datasetId={id} hasFairScore={!!fairBreakdown} />
      </div>

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
      {fairBreakdown ? (
        <div className="mb-8">
          <FairScoreCard fairScore={fairBreakdown.total_score || 0} fairBreakdown={fairBreakdown} />
        </div>
      ) : (
        <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-gray-600">No FAIR assessment available for this dataset yet.</p>
        </div>
      )}

      {/* FAIR Category Scores with Reasoning */}
      {fairBreakdown && (
        <div className="mb-8 space-y-6">
          {/* Findable */}
          {fairBreakdown.findable_score !== null && (
            <div className="p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-blue-900">
                  Findable: {fairBreakdown.findable_score}/25
                </h3>
                <span className="text-sm font-semibold text-blue-700">
                  {((fairBreakdown.findable_score / 25) * 100).toFixed(0)}%
                </span>
              </div>
              {fairBreakdown.findable_reasoning && (
                <p className="text-gray-800 text-sm leading-relaxed">
                  {fairBreakdown.findable_reasoning
                    .replace(/✅/g, '•')
                    .replace(/❌/g, '•')
                    .replace(/⚠️/g, '•')}
                </p>
              )}
            </div>
          )}

          {/* Accessible */}
          {fairBreakdown.accessible_score !== null && (
            <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-green-900">
                  Accessible: {fairBreakdown.accessible_score}/25
                </h3>
                <span className="text-sm font-semibold text-green-700">
                  {((fairBreakdown.accessible_score / 25) * 100).toFixed(0)}%
                </span>
              </div>
              {fairBreakdown.accessible_reasoning && (
                <p className="text-gray-800 text-sm leading-relaxed">
                  {fairBreakdown.accessible_reasoning
                    .replace(/✅/g, '•')
                    .replace(/❌/g, '•')
                    .replace(/⚠️/g, '•')}
                </p>
              )}
            </div>
          )}

          {/* Interoperable */}
          {fairBreakdown.interoperable_score !== null && (
            <div className="p-6 bg-purple-50 border-l-4 border-purple-500 rounded-r-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-purple-900">
                  Interoperable: {fairBreakdown.interoperable_score}/25
                </h3>
                <span className="text-sm font-semibold text-purple-700">
                  {((fairBreakdown.interoperable_score / 25) * 100).toFixed(0)}%
                </span>
              </div>
              {fairBreakdown.interoperable_reasoning && (
                <p className="text-gray-800 text-sm leading-relaxed">
                  {fairBreakdown.interoperable_reasoning
                    .replace(/✅/g, '•')
                    .replace(/❌/g, '•')
                    .replace(/⚠️/g, '•')}
                </p>
              )}
            </div>
          )}

          {/* Reusable */}
          {fairBreakdown.reusable_score !== null && (
            <div className="p-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-amber-900">
                  Reusable: {fairBreakdown.reusable_score}/25
                </h3>
                <span className="text-sm font-semibold text-amber-700">
                  {((fairBreakdown.reusable_score / 25) * 100).toFixed(0)}%
                </span>
              </div>
              {fairBreakdown.reusable_reasoning && (
                <p className="text-gray-800 text-sm leading-relaxed">
                  {fairBreakdown.reusable_reasoning
                    .replace(/✅/g, '•')
                    .replace(/❌/g, '•')
                    .replace(/⚠️/g, '•')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Kohn et al. (2024) Table Scores from Database */}
      {fairBreakdown && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Kohn et al. (2024) Reporting Standards</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Table 4: Geosample Metadata */}
            {fairBreakdown.table4_score !== null && (
              <Tooltip
                content="Table 4: Geosample Metadata"
                description="Sample identification, location (lat/lon/elevation), lithology, mineral type, IGSN assignment, collector information, and stratigraphic context. Essential for sample findability and provenance tracking."
                maxWidth="max-w-md"
              >
                <div className={`p-6 rounded-lg border-2 cursor-help transition-all hover:shadow-lg ${
                  fairBreakdown.table4_score >= 13 ? 'border-green-300 bg-green-50' :
                  fairBreakdown.table4_score >= 10 ? 'border-blue-300 bg-blue-50' :
                  fairBreakdown.table4_score >= 8 ? 'border-yellow-300 bg-yellow-50' :
                  'border-orange-300 bg-orange-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Table 4: Samples</h3>
                    <span className="text-2xl font-bold text-gray-900">
                      {fairBreakdown.table4_score}/15
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Geosample metadata & location</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {((fairBreakdown.table4_score / 15) * 100).toFixed(0)}%
                    </span>
                  </div>
                  {fairBreakdown.table4_reasoning && (
                    <p className="mt-4 text-xs text-gray-700 border-t border-gray-200 pt-3">
                      {fairBreakdown.table4_reasoning
                        .replace(/✅/g, '•')
                        .replace(/❌/g, '•')
                        .replace(/⚠️/g, '•')}
                    </p>
                  )}
                </div>
              </Tooltip>
            )}

            {/* Table 5: FT Count Data */}
            {fairBreakdown.table5_score !== null && (
              <Tooltip
                content="Table 5: Fission-Track Count Data"
                description="Grain-by-grain spontaneous and induced track counts (Ns, Ni), track densities (ρs, ρi), counting areas, dosimeter tracks (Nd, ρd), and U concentrations. Critical for age recalculation and QC assessment."
                maxWidth="max-w-md"
              >
                <div className={`p-6 rounded-lg border-2 cursor-help transition-all hover:shadow-lg ${
                  fairBreakdown.table5_score >= 13 ? 'border-green-300 bg-green-50' :
                  fairBreakdown.table5_score >= 10 ? 'border-blue-300 bg-blue-50' :
                  fairBreakdown.table5_score >= 8 ? 'border-yellow-300 bg-yellow-50' :
                  'border-orange-300 bg-orange-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Table 5: FT Counts</h3>
                    <span className="text-2xl font-bold text-gray-900">
                      {fairBreakdown.table5_score}/15
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Fission-track count data</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {((fairBreakdown.table5_score / 15) * 100).toFixed(0)}%
                    </span>
                  </div>
                  {fairBreakdown.table5_reasoning && (
                    <p className="mt-4 text-xs text-gray-700 border-t border-gray-200 pt-3">
                      {fairBreakdown.table5_reasoning
                        .replace(/✅/g, '•')
                        .replace(/❌/g, '•')
                        .replace(/⚠️/g, '•')}
                    </p>
                  )}
                </div>
              </Tooltip>
            )}

            {/* Table 6: Track Length Data */}
            {fairBreakdown.table6_score !== null && (
              <Tooltip
                content="Table 6: Confined Track Length Data"
                description="Individual track length measurements, c-axis angles, track types (TINT/TINCLE), Dpar measurements, and kinetic parameters. Essential for thermal history modeling."
                maxWidth="max-w-md"
              >
                <div className={`p-6 rounded-lg border-2 cursor-help transition-all hover:shadow-lg ${
                  fairBreakdown.table6_score >= 8 ? 'border-green-300 bg-green-50' :
                  fairBreakdown.table6_score >= 6 ? 'border-blue-300 bg-blue-50' :
                  fairBreakdown.table6_score >= 5 ? 'border-yellow-300 bg-yellow-50' :
                  'border-orange-300 bg-orange-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Table 6: Track Lengths</h3>
                    <span className="text-2xl font-bold text-gray-900">
                      {fairBreakdown.table6_score}/10
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Confined track measurements</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {((fairBreakdown.table6_score / 10) * 100).toFixed(0)}%
                    </span>
                  </div>
                  {fairBreakdown.table6_reasoning && (
                    <p className="mt-4 text-xs text-gray-700 border-t border-gray-200 pt-3">
                      {fairBreakdown.table6_reasoning
                        .replace(/✅/g, '•')
                        .replace(/❌/g, '•')
                        .replace(/⚠️/g, '•')}
                    </p>
                  )}
                </div>
              </Tooltip>
            )}

            {/* Table 10: FT Ages */}
            {fairBreakdown.table10_score !== null && (
              <Tooltip
                content="Table 10: Fission-Track Ages"
                description="Calculated ages (pooled, central, mean), uncertainties, dispersion statistics (P(χ²)), zeta calibration, decay constants (λf, λD), and analytical provenance (analyst, lab, dates). Core age reporting requirements."
                maxWidth="max-w-md"
              >
                <div className={`p-6 rounded-lg border-2 cursor-help transition-all hover:shadow-lg ${
                  fairBreakdown.table10_score >= 8 ? 'border-green-300 bg-green-50' :
                  fairBreakdown.table10_score >= 6 ? 'border-blue-300 bg-blue-50' :
                  fairBreakdown.table10_score >= 5 ? 'border-yellow-300 bg-yellow-50' :
                  'border-orange-300 bg-orange-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Table 10: Ages</h3>
                    <span className="text-2xl font-bold text-gray-900">
                      {fairBreakdown.table10_score}/10
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Calculated ages & statistics</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {((fairBreakdown.table10_score / 10) * 100).toFixed(0)}%
                    </span>
                  </div>
                  {fairBreakdown.table10_reasoning && (
                    <p className="mt-4 text-xs text-gray-700 border-t border-gray-200 pt-3">
                      {fairBreakdown.table10_reasoning
                        .replace(/✅/g, '•')
                        .replace(/❌/g, '•')
                        .replace(/⚠️/g, '•')}
                    </p>
                  )}
                </div>
              </Tooltip>
            )}
          </div>

          {/* Note about Kohn standards */}
          <div className="mt-6 p-4 bg-gray-50 border-l-4 border-gray-400 rounded-r-lg">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> Kohn et al. (2024) defines reporting standards for thermochronology data across 11 tables (Tables 4-11 in GSA Bulletin).
              Scores reflect compliance with these field-level requirements for sample metadata, analytical data, and provenance tracking.
            </p>
          </div>
        </div>
      )}

      {/* Kohn et al. (2024) Table Scores - Enhanced with JSON data */}
      {fairCompliance && !fairBreakdown && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Kohn et al. (2024) Reporting Standards</h2>
            {fairCompliance.summary && (
              <div className={`px-4 py-2 rounded-lg font-bold ${getGradeBadgeColor(fairCompliance.summary.grade)}`}>
                Grade: {fairCompliance.summary.grade}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Table 4: Samples */}
            {fairCompliance.kohn_2024_compliance.table_4_samples.applicable && (
              <Tooltip
                content={KOHN_TABLE_DESCRIPTIONS.table_4_samples.name}
                description={KOHN_TABLE_DESCRIPTIONS.table_4_samples.description}
                maxWidth="max-w-md"
              >
                <div className={`p-6 rounded-lg border-2 cursor-help transition-all hover:shadow-lg ${
                  getFairScoreColor(fairCompliance.kohn_2024_compliance.table_4_samples.percentage || 0)
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">Table 4: Samples</h3>
                    <span className="text-2xl font-bold">
                      {fairCompliance.kohn_2024_compliance.table_4_samples.score}/
                      {fairCompliance.kohn_2024_compliance.table_4_samples.max_score}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sample metadata & location</span>
                    <span className="text-sm font-semibold">
                      {fairCompliance.kohn_2024_compliance.table_4_samples.percentage?.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </Tooltip>
            )}

            {/* Table 5: FT Counts */}
            {fairCompliance.kohn_2024_compliance.table_5_ft_counts.applicable && (
              <Tooltip
                content={KOHN_TABLE_DESCRIPTIONS.table_5_ft_counts.name}
                description={KOHN_TABLE_DESCRIPTIONS.table_5_ft_counts.description}
                maxWidth="max-w-md"
              >
                <div className={`p-6 rounded-lg border-2 cursor-help transition-all hover:shadow-lg ${
                  getFairScoreColor(fairCompliance.kohn_2024_compliance.table_5_ft_counts.percentage || 0)
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">Table 5: FT Counts</h3>
                    <span className="text-2xl font-bold">
                      {fairCompliance.kohn_2024_compliance.table_5_ft_counts.score}/
                      {fairCompliance.kohn_2024_compliance.table_5_ft_counts.max_score}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Track count data</span>
                    <span className="text-sm font-semibold">
                      {fairCompliance.kohn_2024_compliance.table_5_ft_counts.percentage?.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </Tooltip>
            )}

            {/* Table 6: Track Lengths */}
            {fairCompliance.kohn_2024_compliance.table_6_track_lengths.applicable && (
              <Tooltip
                content={KOHN_TABLE_DESCRIPTIONS.table_6_track_lengths.name}
                description={KOHN_TABLE_DESCRIPTIONS.table_6_track_lengths.description}
                maxWidth="max-w-md"
              >
                <div className={`p-6 rounded-lg border-2 cursor-help transition-all hover:shadow-lg ${
                  getFairScoreColor(fairCompliance.kohn_2024_compliance.table_6_track_lengths.percentage || 0)
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">Table 6: Track Lengths</h3>
                    <span className="text-2xl font-bold">
                      {fairCompliance.kohn_2024_compliance.table_6_track_lengths.score}/
                      {fairCompliance.kohn_2024_compliance.table_6_track_lengths.max_score}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Confined track measurements</span>
                    <span className="text-sm font-semibold">
                      {fairCompliance.kohn_2024_compliance.table_6_track_lengths.percentage?.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </Tooltip>
            )}

            {/* Table 7: LA-ICP-MS */}
            {fairCompliance.kohn_2024_compliance.table_7_la_icp_ms.applicable && (
              <Tooltip
                content={KOHN_TABLE_DESCRIPTIONS.table_7_la_icp_ms.name}
                description={KOHN_TABLE_DESCRIPTIONS.table_7_la_icp_ms.description}
                maxWidth="max-w-md"
              >
                <div className={`p-6 rounded-lg border-2 cursor-help transition-all hover:shadow-lg ${
                  getFairScoreColor(fairCompliance.kohn_2024_compliance.table_7_la_icp_ms.percentage || 0)
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">Table 7: LA-ICP-MS</h3>
                    <span className="text-2xl font-bold">
                      {fairCompliance.kohn_2024_compliance.table_7_la_icp_ms.score}/
                      {fairCompliance.kohn_2024_compliance.table_7_la_icp_ms.max_score}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Laser ablation U measurements</span>
                    <span className="text-sm font-semibold">
                      {fairCompliance.kohn_2024_compliance.table_7_la_icp_ms.percentage?.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </Tooltip>
            )}

            {/* Table 8: EPMA */}
            {fairCompliance.kohn_2024_compliance.table_8_epma.applicable && (
              <Tooltip
                content={KOHN_TABLE_DESCRIPTIONS.table_8_epma.name}
                description={KOHN_TABLE_DESCRIPTIONS.table_8_epma.description}
                maxWidth="max-w-md"
              >
                <div className={`p-6 rounded-lg border-2 cursor-help transition-all hover:shadow-lg ${
                  getFairScoreColor(fairCompliance.kohn_2024_compliance.table_8_epma.percentage || 0)
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">Table 8: EPMA</h3>
                    <span className="text-2xl font-bold">
                      {fairCompliance.kohn_2024_compliance.table_8_epma.score}/
                      {fairCompliance.kohn_2024_compliance.table_8_epma.max_score}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mineral composition data</span>
                    <span className="text-sm font-semibold">
                      {fairCompliance.kohn_2024_compliance.table_8_epma.percentage?.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </Tooltip>
            )}

            {/* Table 9: Kinetic Parameters */}
            {fairCompliance.kohn_2024_compliance.table_9_kinetic_params.applicable && (
              <Tooltip
                content={KOHN_TABLE_DESCRIPTIONS.table_9_kinetic_params.name}
                description={KOHN_TABLE_DESCRIPTIONS.table_9_kinetic_params.description}
                maxWidth="max-w-md"
              >
                <div className={`p-6 rounded-lg border-2 cursor-help transition-all hover:shadow-lg ${
                  getFairScoreColor(fairCompliance.kohn_2024_compliance.table_9_kinetic_params.percentage || 0)
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">Table 9: Kinetics</h3>
                    <span className="text-2xl font-bold">
                      {fairCompliance.kohn_2024_compliance.table_9_kinetic_params.score}/
                      {fairCompliance.kohn_2024_compliance.table_9_kinetic_params.max_score}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Annealing kinetic parameters</span>
                    <span className="text-sm font-semibold">
                      {fairCompliance.kohn_2024_compliance.table_9_kinetic_params.percentage?.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </Tooltip>
            )}

            {/* Table 10: FT Ages */}
            {fairCompliance.kohn_2024_compliance.table_10_ft_ages.applicable && (
              <Tooltip
                content={KOHN_TABLE_DESCRIPTIONS.table_10_ft_ages.name}
                description={KOHN_TABLE_DESCRIPTIONS.table_10_ft_ages.description}
                maxWidth="max-w-md"
              >
                <div className={`p-6 rounded-lg border-2 cursor-help transition-all hover:shadow-lg ${
                  getFairScoreColor(fairCompliance.kohn_2024_compliance.table_10_ft_ages.percentage || 0)
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">Table 10: Ages</h3>
                    <span className="text-2xl font-bold">
                      {fairCompliance.kohn_2024_compliance.table_10_ft_ages.score}/
                      {fairCompliance.kohn_2024_compliance.table_10_ft_ages.max_score}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Calculated ages & statistics</span>
                    <span className="text-sm font-semibold">
                      {fairCompliance.kohn_2024_compliance.table_10_ft_ages.percentage?.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </Tooltip>
            )}

            {/* Table 11: Thermal Models */}
            {fairCompliance.kohn_2024_compliance.table_11_thermal_models.applicable && (
              <Tooltip
                content={KOHN_TABLE_DESCRIPTIONS.table_11_thermal_models.name}
                description={KOHN_TABLE_DESCRIPTIONS.table_11_thermal_models.description}
                maxWidth="max-w-md"
              >
                <div className={`p-6 rounded-lg border-2 cursor-help transition-all hover:shadow-lg ${
                  getFairScoreColor(fairCompliance.kohn_2024_compliance.table_11_thermal_models.percentage || 0)
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">Table 11: Models</h3>
                    <span className="text-2xl font-bold">
                      {fairCompliance.kohn_2024_compliance.table_11_thermal_models.score}/
                      {fairCompliance.kohn_2024_compliance.table_11_thermal_models.max_score}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Thermal history modeling</span>
                    <span className="text-sm font-semibold">
                      {fairCompliance.kohn_2024_compliance.table_11_thermal_models.percentage?.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </Tooltip>
            )}
          </div>

          {/* Strengths and Gaps */}
          {(fairCompliance.strengths.length > 0 || fairCompliance.gaps.length > 0) && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              {fairCompliance.strengths.length > 0 && (
                <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                  <h3 className="text-lg font-bold text-green-900 mb-3">Strengths</h3>
                  <ul className="space-y-2 text-sm text-gray-800">
                    {fairCompliance.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">✅</span>
                        <span>{strength.replace(/^✅\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gaps */}
              {fairCompliance.gaps.length > 0 && (
                <div className="p-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                  <h3 className="text-lg font-bold text-amber-900 mb-3">Areas for Improvement</h3>
                  <ul className="space-y-2 text-sm text-gray-800">
                    {fairCompliance.gaps.map((gap, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">⚠️</span>
                        <span>{gap.replace(/^[⚠️❌]\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {fairCompliance.notes && (
            <div className="mt-6 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Additional Notes</h3>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                {fairCompliance.notes}
              </p>
            </div>
          )}
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
