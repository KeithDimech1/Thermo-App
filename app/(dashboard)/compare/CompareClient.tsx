/**
 * Compare Page - Side-by-side assay comparison tool
 *
 * Features:
 * - Compare 2-4 test configurations side-by-side
 * - Warning banner about IU/ml non-standardization
 * - Methodology comparison with educational content
 * - Risk tier and confidence badges
 * - Statistical comparison
 * - CSV export functionality
 *
 * Reference: Dimech W. Clin Microbiol Rev. 2021;34(4):e00035-21
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ComparisonWarningBanner } from '@/components/education/ComparisonWarningBanner';
import { MethodologyComparison } from '@/components/education/MethodologyComparison';
import { RiskTierBadge, getPathogenRiskTier } from '@/components/quality/RiskTierBadge';
import { DataConfidenceBadge } from '@/components/quality/DataConfidenceBadge';

interface ComparisonConfig {
  config_id: number;
  marker_name: string;
  pathogen_name: string;
  assay_name: string;
  manufacturer_name: string;
  methodology: string;
  platform: string | null;
  events_examined: number;
  quality_rating: string;
  cv_lt_10_percentage: number;
  cv_10_15_percentage: number;
  cv_15_20_percentage: number;
  cv_gt_20_percentage: number;
  mean_cv: number | null;
  methodology_warning?: string;
  comparison_notes?: string;
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedConfigs, setSelectedConfigs] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableConfigs, setAvailableConfigs] = useState<ComparisonConfig[]>([]);
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);

  // Parse URL params and preselect configs
  useEffect(() => {
    const configsParam = searchParams.get('configs');
    if (configsParam && !urlParamsProcessed) {
      const configIds = configsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (configIds.length > 0) {
        setSelectedConfigs(configIds.slice(0, 4)); // Max 4 configs
        setUrlParamsProcessed(true);
      }
    }
  }, [searchParams, urlParamsProcessed]);

  // Load available configs for selection
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const response = await fetch('/api/configs?limit=50');
        const data = await response.json();
        setAvailableConfigs(data.configs || []);
      } catch (error) {
        console.error('Failed to load configs:', error);
      }
    };
    fetchConfigs();
  }, []);

  // Auto-trigger comparison if 2+ configs are preselected from URL
  useEffect(() => {
    if (urlParamsProcessed && selectedConfigs.length >= 2 && comparisonData.length === 0 && !loading) {
      handleCompare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlParamsProcessed, selectedConfigs.length]);

  // Update URL when selections change
  const updateURLParams = (configIds: number[]) => {
    if (configIds.length > 0) {
      router.push(`/compare?configs=${configIds.join(',')}`);
    } else {
      router.push('/compare');
    }
  };

  // Fetch comparison data
  const handleCompare = async () => {
    if (selectedConfigs.length < 2) {
      alert('Please select at least 2 configurations to compare');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configIds: selectedConfigs }),
      });

      const data = await response.json();
      setComparisonData(data.configs || []);
    } catch (error) {
      console.error('Comparison failed:', error);
      alert('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (comparisonData.length === 0) return;

    const headers = [
      'Manufacturer',
      'Assay',
      'Methodology',
      'Pathogen',
      'Marker',
      'Quality Rating',
      'Events Examined',
      'CV <10%',
      'CV 10-15%',
      'CV 15-20%',
      'CV >20%',
      'Mean CV',
    ];

    const rows = comparisonData.map((config) => [
      config.manufacturer_name,
      config.assay_name,
      config.methodology,
      config.pathogen_name,
      config.marker_name,
      config.quality_rating,
      config.events_examined,
      `${config.cv_lt_10_percentage.toFixed(1)}%`,
      `${config.cv_10_15_percentage.toFixed(1)}%`,
      `${config.cv_15_20_percentage.toFixed(1)}%`,
      `${config.cv_gt_20_percentage.toFixed(1)}%`,
      config.mean_cv ? config.mean_cv.toFixed(2) : 'N/A',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assay-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter configs based on search
  const filteredConfigs = availableConfigs.filter(
    (config) =>
      config.manufacturer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.assay_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.marker_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleConfigSelection = (configId: number) => {
    let newConfigs: number[];
    if (selectedConfigs.includes(configId)) {
      newConfigs = selectedConfigs.filter((id) => id !== configId);
    } else {
      if (selectedConfigs.length >= 4) {
        alert('Maximum 4 configurations can be compared at once');
        return;
      }
      newConfigs = [...selectedConfigs, configId];
    }
    setSelectedConfigs(newConfigs);
    updateURLParams(newConfigs);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Compare Assays</h1>
        <p className="text-gray-600 mt-2">Side-by-side comparison of test configuration performance</p>
      </div>

      {/* Warning Banner - Always Visible */}
      <ComparisonWarningBanner />

      {/* Selection Interface */}
      {comparisonData.length === 0 && (
        <Card variant="bordered">
          <CardContent className="py-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Configurations to Compare</h2>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by manufacturer, assay, or marker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Selected Count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Selected: <strong>{selectedConfigs.length}</strong> / 4 (minimum 2 required)
              </p>
              {selectedConfigs.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedConfigs([]);
                    updateURLParams([]);
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Config List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredConfigs.slice(0, 20).map((config) => (
                <button
                  key={config.config_id}
                  onClick={() => toggleConfigSelection(config.config_id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedConfigs.includes(config.config_id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {config.manufacturer_name} - {config.assay_name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {config.marker_name} ({config.pathogen_name})
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {config.methodology}
                        </span>
                        <span className="text-xs text-gray-500">
                          CV&lt;10%: {config.cv_lt_10_percentage !== null ? config.cv_lt_10_percentage.toFixed(1) : '—'}%
                        </span>
                      </div>
                    </div>
                    {selectedConfigs.includes(config.config_id) && (
                      <div className="text-blue-600 text-xl">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Compare Button */}
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleCompare}
                disabled={selectedConfigs.length < 2 || loading}
                size="lg"
                className="min-w-48"
              >
                {loading ? 'Loading...' : `Compare ${selectedConfigs.length} Configurations`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {comparisonData.length > 0 && (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => {
                setComparisonData([]);
                setSelectedConfigs([]);
                updateURLParams([]);
              }}
            >
              ← New Comparison
            </Button>
            <Button variant="primary" onClick={handleExportCSV}>
              Export to CSV
            </Button>
          </div>

          {/* Methodology Comparison (if applicable) */}
          {comparisonData.length === 2 && comparisonData[0] && comparisonData[1] && (
            <MethodologyComparison
              assay1={{
                name: comparisonData[0].assay_name,
                methodology: comparisonData[0].methodology,
                manufacturer: comparisonData[0].manufacturer_name,
              }}
              assay2={{
                name: comparisonData[1].assay_name,
                methodology: comparisonData[1].methodology,
                manufacturer: comparisonData[1].manufacturer_name,
              }}
            />
          )}

          {/* Comparison Table */}
          <Card variant="bordered">
            <CardContent className="py-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Comparison</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Configuration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Risk / Confidence
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        CV &lt;10%<br />(Excellent)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        CV 10-15%<br />(Good)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        CV 15-20%<br />(Acceptable)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        CV &gt;20%<br />(Poor)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Mean CV
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {comparisonData.map((config, index) => {
                      const riskTier = getPathogenRiskTier(config.pathogen_name);
                      return (
                        <tr key={config.config_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-semibold text-gray-900">{config.manufacturer_name}</div>
                              <div className="text-sm text-gray-600">{config.assay_name}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {config.marker_name} · {config.methodology}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <RiskTierBadge riskTier={riskTier} pathogenName={config.pathogen_name} />
                              <DataConfidenceBadge eventsExamined={config.events_examined} />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-lg font-bold text-green-600">
                              {config.cv_lt_10_percentage !== null ? config.cv_lt_10_percentage.toFixed(1) : '—'}%
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-lg font-semibold text-blue-600">
                              {config.cv_10_15_percentage !== null ? config.cv_10_15_percentage.toFixed(1) : '—'}%
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-lg font-semibold text-orange-600">
                              {config.cv_15_20_percentage !== null ? config.cv_15_20_percentage.toFixed(1) : '—'}%
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-lg font-semibold text-red-600">
                              {config.cv_gt_20_percentage !== null ? config.cv_gt_20_percentage.toFixed(1) : '—'}%
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              {config.mean_cv ? config.mean_cv.toFixed(2) : 'N/A'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Statistical Summary */}
          <Card variant="bordered">
            <CardContent className="py-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistical Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-green-900">Best Performer (CV&lt;10%)</div>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    {Math.max(...comparisonData.map((c) => c.cv_lt_10_percentage)).toFixed(1)}%
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    {comparisonData.find(
                      (c) => c.cv_lt_10_percentage === Math.max(...comparisonData.map((d) => d.cv_lt_10_percentage))
                    )?.manufacturer_name}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-blue-900">Average Performance</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    {(
                      comparisonData.reduce((sum, c) => sum + c.cv_lt_10_percentage, 0) / comparisonData.length
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="text-xs text-blue-700 mt-1">Mean CV&lt;10% across all configs</div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-900">Total Events</div>
                  <div className="text-2xl font-bold text-gray-700 mt-1">
                    {comparisonData.reduce((sum, c) => sum + c.events_examined, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Combined QC events examined</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
