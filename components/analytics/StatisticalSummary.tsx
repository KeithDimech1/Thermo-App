/**
 * Statistical Summary Component
 *
 * Displays advanced statistical analysis for QC data
 * Shows control limits, process capability, and outlier detection
 *
 * Add this to your analytics page for enhanced statistical insights
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useEffect, useState } from 'react';

interface CVMetrics {
  mean: number;
  median: number;
  stdDev: number;
  cv: number;
  upperControlLimit: number;
  lowerControlLimit: number;
  outliers: number[];
  q1: number;
  q3: number;
  iqr: number;
  p90: number;
  p95: number;
  min: number;
  max: number;
  count: number;
}

interface ProcessCapability {
  cpk: number;
  usl: number;
  lsl: number;
  mean: number;
  sigma: number;
  withinSpec: number;
  interpretation: string;
}

interface StatsData {
  overall: CVMetrics;
  capability: ProcessCapability;
  outliers: {
    consensus: Array<{ value: number; index: number; methods: number }>;
  };
  distribution: {
    skewness: number;
    percentiles: {
      p5: number;
      p25: number;
      p50: number;
      p75: number;
      p95: number;
    };
  };
  dataInfo: {
    totalConfigs: number;
    configsWithCV: number;
  };
}

interface StatisticalSummaryProps {
  dataset?: 'curated' | 'all';
}

interface FilterOption {
  id: number;
  name: string;
}

interface PathogenOption {
  id: number;
  name: string;
  abbreviation: string;
}

interface AssayOption {
  id: number;
  name: string;
  pathogen_ids: number[];
}

interface FilterOptions {
  manufacturers: FilterOption[];
  assays: AssayOption[];
  pathogens: PathogenOption[];
}

interface ErrorResponse {
  error: string;
  errorType?: 'NO_DATA' | 'INSUFFICIENT_DATA';
  message?: string;
  dataPoints?: number;
  minimumRequired?: number;
  suggestion?: string;
}

export function StatisticalSummary({ dataset = 'curated' }: StatisticalSummaryProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    manufacturers: [],
    assays: [],
    pathogens: [],
  });
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedPathogen, setSelectedPathogen] = useState<string>('');
  const [selectedAssay, setSelectedAssay] = useState<string>('');

  // Filter assays based on selected pathogen
  const filteredAssays = selectedPathogen
    ? filterOptions.assays.filter(assay =>
        assay.pathogen_ids && assay.pathogen_ids.includes(parseInt(selectedPathogen))
      )
    : filterOptions.assays;

  // Fetch filter options
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const response = await fetch(`/api/filters?dataset=${dataset}`);
        if (response.ok) {
          const data = await response.json();
          setFilterOptions({
            manufacturers: data.manufacturers || [],
            assays: data.assays || [],
            pathogens: data.pathogens || [],
          });
        }
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    }

    fetchFilterOptions();
  }, [dataset]);

  // Fetch statistics
  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null); // Clear previous errors
        let url = `/api/analytics/stats?dataset=${dataset}`;
        if (selectedManufacturer) {
          url += `&manufacturerId=${selectedManufacturer}`;
        }
        if (selectedAssay) {
          url += `&assayId=${selectedAssay}`;
        }
        const response = await fetch(url);

        if (!response.ok) {
          // Try to parse error response
          const errorData = await response.json();
          setError(errorData);
          setStats(null);
          return;
        }

        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError({
          error: 'Failed to fetch statistics',
          message: err instanceof Error ? err.message : 'Unknown error'
        });
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [dataset, selectedManufacturer, selectedAssay]);

  const { overall, capability, outliers, distribution } = stats || {
    overall: undefined,
    capability: undefined,
    outliers: undefined,
    distribution: undefined
  };

  // Generate context-aware educational text based on actual values
  const getControlChartInterpretation = () => {
    if (!overall) return null;

    const ucl = overall.upperControlLimit;
    const stdDev = overall.stdDev;
    const mean = overall.mean;

    // Determine UCL quality
    let uclQuality: 'excellent' | 'good' | 'fair' | 'poor';
    let uclColor: string;
    let variabilityLevel: string;

    if (ucl <= 105) {
      uclQuality = 'excellent';
      uclColor = 'text-green-700';
      variabilityLevel = 'very low variability';
    } else if (ucl <= 115) {
      uclQuality = 'good';
      uclColor = 'text-blue-700';
      variabilityLevel = 'low variability';
    } else if (ucl <= 130) {
      uclQuality = 'fair';
      uclColor = 'text-amber-700';
      variabilityLevel = 'moderate variability';
    } else {
      uclQuality = 'poor';
      uclColor = 'text-red-700';
      variabilityLevel = 'high variability';
    }

    // Determine standard deviation quality
    let stdDevQuality: 'excellent' | 'good' | 'fair' | 'poor';
    if (stdDev <= 5) {
      stdDevQuality = 'excellent';
    } else if (stdDev <= 10) {
      stdDevQuality = 'good';
    } else if (stdDev <= 20) {
      stdDevQuality = 'fair';
    } else {
      stdDevQuality = 'poor';
    }

    return { uclQuality, uclColor, variabilityLevel, stdDevQuality, ucl, stdDev, mean };
  };

  const interpretation = getControlChartInterpretation();

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Filter Statistics</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Filter analysis by manufacturer or assay (optional)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pathogen
              </label>
              <select
                value={selectedPathogen}
                onChange={(e) => {
                  setSelectedPathogen(e.target.value);
                  // Reset assay selection when pathogen changes
                  if (e.target.value) {
                    setSelectedAssay('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Pathogens</option>
                {filterOptions.pathogens.map((pathogen) => (
                  <option key={pathogen.id} value={pathogen.id}>
                    {pathogen.abbreviation}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturer
              </label>
              <select
                value={selectedManufacturer}
                onChange={(e) => setSelectedManufacturer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Manufacturers</option>
                {filterOptions.manufacturers.map((mfr) => (
                  <option key={mfr.id} value={mfr.id}>
                    {mfr.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assay {selectedPathogen && <span className="text-xs text-gray-500">(filtered by pathogen)</span>}
              </label>
              <select
                value={selectedAssay}
                onChange={(e) => setSelectedAssay(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={filteredAssays.length === 0}
              >
                <option value="">All Assays</option>
                {filteredAssays.map((assay) => (
                  <option key={assay.id} value={assay.id}>
                    {assay.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedPathogen('');
                  setSelectedManufacturer('');
                  setSelectedAssay('');
                }}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {(selectedPathogen || selectedManufacturer || selectedAssay) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Active Filters:</strong>{' '}
                {selectedPathogen &&
                  `Pathogen: ${
                    filterOptions.pathogens.find(
                      (p) => p.id === parseInt(selectedPathogen)
                    )?.abbreviation
                  }`}
                {selectedPathogen && (selectedManufacturer || selectedAssay) && ' | '}
                {selectedManufacturer &&
                  `Manufacturer: ${
                    filterOptions.manufacturers.find(
                      (m) => m.id === parseInt(selectedManufacturer)
                    )?.name
                  }`}
                {selectedManufacturer && selectedAssay && ' | '}
                {selectedAssay &&
                  `Assay: ${
                    filterOptions.assays.find(
                      (a) => a.id === parseInt(selectedAssay)
                    )?.name
                  }`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card variant="bordered">
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-3"></div>
              <div>Loading statistical analysis...</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact Error Alert */}
      {!loading && error && (
        <Card variant="bordered" className={
          error.errorType === 'INSUFFICIENT_DATA' ? 'bg-amber-50 border-amber-300' :
          error.errorType === 'NO_DATA' ? 'bg-blue-50 border-blue-300' :
          'bg-red-50 border-red-300'
        }>
          <CardContent className="py-4">
            {error.errorType === 'INSUFFICIENT_DATA' ? (
              <div className="flex items-start gap-3">
                <div className="text-2xl">📊</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-900 mb-1">Not Enough Data</h4>
                  <p className="text-sm text-amber-800 mb-2">
                    {error.message}
                  </p>
                  <p className="text-xs text-amber-700">
                    💡 <strong>Suggestion:</strong> {error.suggestion}
                  </p>
                </div>
              </div>
            ) : error.errorType === 'NO_DATA' ? (
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔍</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">No Data Found</h4>
                  <p className="text-sm text-blue-800">
                    {error.message || 'No test configurations found matching the selected filters.'}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Try removing one or more filters to see more data.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-1">Error Loading Statistics</h4>
                  <p className="text-sm text-red-800">
                    {error.message || error.error || 'Unknown error occurred'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards - Only show when we have data */}
      {!loading && !error && stats && (
        <>
      {/* What These Stats Mean - Educational Card */}
      <Card variant="bordered" className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">📘 Understanding Your QC Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-900">
            <p>
              <strong>These statistics analyze the "CV &lt;10%" values</strong> from your 132 test
              configurations. This measures how consistently each assay performs (not the CV of
              individual measurements).
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <strong className="text-blue-800">📊 Control Charts:</strong>
                <p className="text-blue-800 text-xs mt-1">
                  Track process stability. Values outside control limits need investigation.
                </p>
              </div>
              <div>
                <strong className="text-blue-800">🎯 Process Capability (Cpk):</strong>
                <p className="text-blue-800 text-xs mt-1">
                  Measures if your assays consistently meet quality targets (≥95% CV &lt;10%).
                </p>
              </div>
              <div>
                <strong className="text-blue-800">📈 Distribution:</strong>
                <p className="text-blue-800 text-xs mt-1">
                  Shows the spread and shape of your quality data across all manufacturers.
                </p>
              </div>
              <div>
                <strong className="text-blue-800">⚠️ Outliers:</strong>
                <p className="text-blue-800 text-xs mt-1">
                  Flags unusually poor performers that may need review or removal from analysis.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Limits */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Control Chart Statistics</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Shewhart control limits for monitoring QC performance (mean ± 3σ)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Mean CV &lt;10%</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {overall!.mean}%
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Lower Control Limit</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {overall!.lowerControlLimit}%
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Upper Control Limit</div>
              <div className="text-2xl font-bold text-red-600 mt-1">
                {overall!.upperControlLimit}%
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Standard Deviation</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">
                {overall!.stdDev}%
              </div>
            </div>
          </div>

          {/* Context-aware educational text */}
          {interpretation && interpretation.uclQuality === 'excellent' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-900">
                <strong>✅ Excellent Control:</strong> Your mean "CV &lt;10%" is{' '}
                <strong>{interpretation.mean}%</strong>, and the Upper Control Limit of{' '}
                <strong>{interpretation.ucl}%</strong> indicates <strong className="text-green-700">very low variability</strong>.
                This is outstanding! Your assays show consistent, predictable performance with minimal variation between manufacturers.
              </p>
            </div>
          )}

          {interpretation && interpretation.uclQuality === 'good' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>👍 Good Control:</strong> Your mean "CV &lt;10%" is{' '}
                <strong>{interpretation.mean}%</strong>, and the Upper Control Limit of{' '}
                <strong>{interpretation.ucl}%</strong> shows <strong className="text-blue-700">low variability</strong>.
                Performance is generally consistent with only minor variations between assays. This indicates good process control.
              </p>
            </div>
          )}

          {interpretation && interpretation.uclQuality === 'fair' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-900">
                <strong>⚠️ Moderate Variability:</strong> Your mean "CV &lt;10%" is{' '}
                <strong>{interpretation.mean}%</strong>, and the Upper Control Limit of{' '}
                <strong>{interpretation.ucl}%</strong> indicates <strong className="text-amber-700">moderate variability</strong>.
                Some assays perform well while others show inconsistent results. Consider investigating lower-performing configurations.
              </p>
            </div>
          )}

          {interpretation && interpretation.uclQuality === 'poor' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-900">
                <strong>🔴 High Variability:</strong> Your mean "CV &lt;10%" is{' '}
                <strong>{interpretation.mean}%</strong>, but the Upper Control Limit of{' '}
                <strong>{interpretation.ucl}%</strong> (well above 100%) indicates <strong className="text-red-700">high variability</strong>.
                This means some assays perform excellently (near 100%) while others perform poorly, resulting in unpredictable quality across the dataset.
              </p>
            </div>
          )}

          {/* Recommendation based on standard deviation */}
          {interpretation && interpretation.stdDevQuality === 'excellent' && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-900">
                <strong>📊 Outstanding Consistency:</strong> Standard deviation of {interpretation.stdDev}% shows exceptional uniformity.
                All assays perform at similar quality levels - this is ideal for quality control!
              </p>
            </div>
          )}

          {interpretation && interpretation.stdDevQuality === 'good' && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>✓ Good Consistency:</strong> Standard deviation of {interpretation.stdDev}% indicates reliable performance.
                Most assays cluster around the mean with only small variations.
              </p>
            </div>
          )}

          {interpretation && interpretation.stdDevQuality === 'fair' && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-900">
                <strong>📈 Recommendation:</strong> Standard deviation of {interpretation.stdDev}% suggests noticeable spread.
                Consider filtering to "excellent" and "good" rated assays to focus on consistent performers.
              </p>
            </div>
          )}

          {interpretation && interpretation.stdDevQuality === 'poor' && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-900">
                <strong>⚠️ Action Needed:</strong> High standard deviation ({interpretation.stdDev}%) indicates extreme variation.
                Strongly recommend filtering to only "excellent" and "good" rated assays for meaningful analysis, or investigate poor performers individually.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Capability */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Process Capability Analysis (Cpk)</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Measures how well the QC process meets specification limits
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div
                className={`text-5xl font-bold ${
                  capability!.cpk >= 1.33
                    ? 'text-green-600'
                    : capability!.cpk >= 1.0
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {capability!.cpk}
              </div>
              <div className="text-sm text-gray-600 mt-2">Cpk Index</div>
              <div
                className={`text-sm font-semibold mt-2 ${
                  capability!.cpk >= 1.33
                    ? 'text-green-700'
                    : capability!.cpk >= 1.0
                    ? 'text-amber-700'
                    : 'text-red-700'
                }`}
              >
                {capability!.interpretation}
              </div>
            </div>

            <div className="border-l border-r border-gray-200 px-6">
              <div className="text-sm text-gray-600 mb-4">Specification Limits</div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Upper Spec (USL):</span>
                  <span className="text-sm font-semibold">{capability!.usl}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Lower Spec (LSL):</span>
                  <span className="text-sm font-semibold">{capability!.lsl}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Process σ:</span>
                  <span className="text-sm font-semibold">{capability!.sigma}%</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{capability!.withinSpec}%</div>
              <div className="text-sm text-gray-600 mt-2">Within Specification</div>
              <div className="text-xs text-gray-500 mt-2">
                Configs meeting quality standards
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-900">
              <strong>⚠️ What Cpk = {capability!.cpk} Means:</strong> Your overall QC process is{' '}
              <strong>not capable</strong> of consistently meeting the target (≥95% CV &lt;10%). Only{' '}
              <strong>{capability!.withinSpec}%</strong> of test configurations meet this standard.
              This is normal when including all manufacturers - many commercial assays don't achieve
              95%+ excellent precision.
            </p>
          </div>
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-900">
              <strong>✅ Good News:</strong> You have <strong>67 "excellent"</strong> configurations
              (50.8%) that DO meet the standard. The low Cpk reflects the mix of excellent and
              poor performers. For procurement decisions, focus on the top performers shown in the
              heatmap and distribution charts.
            </p>
          </div>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>Cpk Benchmarks:</strong> Cpk ≥2.0 = World Class | Cpk ≥1.33 = Capable |
              Cpk ≥1.0 = Marginal | Cpk &lt;1.0 = Not Capable (current). Higher Cpk indicates better
              process control and consistency.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Distribution & Outliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distribution Stats */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Distribution Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Median (P50):</span>
                <span className="text-sm font-semibold">{overall!.median}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Q1 (P25):</span>
                <span className="text-sm font-semibold">{overall!.q1}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Q3 (P75):</span>
                <span className="text-sm font-semibold">{overall!.q3}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">IQR:</span>
                <span className="text-sm font-semibold">{overall!.iqr}%</span>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm text-gray-600">90th Percentile:</span>
                <span className="text-sm font-semibold">{overall!.p90}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">95th Percentile:</span>
                <span className="text-sm font-semibold">{overall!.p95}%</span>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm text-gray-600">Skewness:</span>
                <span className="text-sm font-semibold">{distribution!.skewness}</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs text-purple-900">
                <strong>📊 Distribution Insights:</strong> Median (P50) = {overall!.median}% shows
                the "typical" assay. The <strong>negative skewness ({distribution!.skewness})</strong>{' '}
                means your data is left-skewed - most assays perform well (clustered near 100%), with
                a long tail of poor performers pulling the mean down. The IQR of {overall!.iqr}%
                shows substantial variability between manufacturers.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Outlier Detection */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Outlier Detection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="text-4xl font-bold text-red-600">
                  {outliers!.consensus.length}
                </div>
                <div className="text-sm text-gray-600 mt-2">Consensus Outliers Detected</div>
                <div className="text-xs text-gray-500 mt-1">
                  (Flagged by 2+ statistical methods)
                </div>
              </div>

              {outliers!.consensus.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-red-900 mb-2">
                    Outlier Values:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {outliers!.consensus.slice(0, 10).map((outlier, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-red-100 text-red-800 text-xs font-mono rounded"
                      >
                        {outlier.value.toFixed(1)}%
                      </span>
                    ))}
                    {outliers!.consensus.length > 10 && (
                      <span className="px-2 py-1 text-red-600 text-xs">
                        +{outliers!.consensus.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-700">
                  <strong>Methods:</strong> IQR method, Z-score method, and Modified Z-score method.
                  <strong> Consensus = flagged by 2+ methods</strong> (high confidence).
                </p>
              </div>

              {outliers!.consensus.length === 0 ? (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-900">
                    <strong>✅ No Statistical Outliers Found:</strong> All test configurations fall
                    within expected variation. This suggests your dataset is statistically clean,
                    though individual poor performers can still be identified in the quality ratings
                    tab.
                  </p>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-900">
                    <strong>⚠️ Outliers Detected:</strong> These configurations are statistically
                    unusual. Review them to determine if they represent: (1) genuinely poor assays,
                    (2) data entry errors, or (3) special circumstances (e.g., experimental methods).
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actionable Summary Card */}
      <Card variant="bordered" className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-indigo-900">🎯 Key Takeaways & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-lg">📌</span>
              <p className="text-indigo-900">
                <strong>Your Data Spread:</strong> CV &lt;10% values range from{' '}
                <strong>{overall!.min}%</strong> to <strong>{overall!.max}%</strong>. The median of{' '}
                <strong>{overall!.median}%</strong> shows most assays perform well, but high
                variability (SD = {overall!.stdDev}%) indicates mixed quality across manufacturers.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">✅</span>
              <p className="text-indigo-900">
                <strong>Focus on Winners:</strong> 67 configurations (50.8%) are "excellent" with
                ≥95% CV &lt;10%. Use the Heatmap tab to identify which marker-manufacturer
                combinations consistently deliver excellent QC performance.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <p className="text-indigo-900">
                <strong>Process Not Capable:</strong> Cpk = {capability!.cpk} means your overall
                assay pool doesn't consistently meet the 95% target. This is expected when including
                all manufacturers. For procurement, filter to "excellent" and "good" ratings only.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">🔬</span>
              <p className="text-indigo-900">
                <strong>Next Steps:</strong> Compare top performers in the Distribution tab, review
                manufacturer-specific data in the Heatmap tab, and consider excluding "poor" rated
                configurations from analysis to see statistics for viable assays only.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card variant="bordered" className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">Statistical Summary</div>
              <div className="text-xs text-gray-600 mt-1">
                Analyzing {stats!.dataInfo.configsWithCV} of {stats!.dataInfo.totalConfigs} test
                configurations with CV data
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-gray-600">Range: </span>
                <span className="font-semibold">
                  {overall!.min}% – {overall!.max}%
                </span>
              </div>
              <div>
                <span className="text-gray-600">CV of CVs: </span>
                <span className="font-semibold">{overall!.cv}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
