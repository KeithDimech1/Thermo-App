/**
 * AI Cost Summary Component
 * Displays token usage and costs for an extraction session
 */

'use client';

import { useEffect, useState } from 'react';

interface CostBreakdown {
  analysis: { input: number; output: number; calls: number; cost: number };
  extraction: { input: number; output: number; calls: number; cost: number };
  fair_analysis: { input: number; output: number; calls: number; cost: number };
  total: number;
  total_tokens: number;
  model: string;
}

interface Props {
  sessionId: string;
}

export function AICostSummary({ sessionId }: Props) {
  const [costs, setCosts] = useState<CostBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/extraction/${sessionId}/costs`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch costs');
        return res.json();
      })
      .then(setCosts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <div className="text-sm text-blue-700">Loading AI usage data...</div>
      </div>
    );
  }

  if (error || !costs) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
        <div className="text-sm text-gray-600">AI usage data not available</div>
      </div>
    );
  }

  const formatTokens = (num: number) => num.toLocaleString();
  const formatCost = (usd: number) => {
    if (usd < 0.01) return `$${(usd * 100).toFixed(3)}¢`;
    return `$${usd.toFixed(4)}`;
  };

  const totalInput = costs.analysis.input + costs.extraction.input + costs.fair_analysis.input;
  const totalOutput = costs.analysis.output + costs.extraction.output + costs.fair_analysis.output;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        AI Usage Summary
      </h3>

      <div className="space-y-2 text-sm">
        {/* Paper Analysis */}
        {costs.analysis.calls > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-blue-800">
              Paper Analysis:
              <span className="text-blue-600 text-xs ml-1">({costs.analysis.calls} call{costs.analysis.calls > 1 ? 's' : ''})</span>
            </span>
            <span className="font-mono text-blue-900">
              {formatTokens(costs.analysis.input + costs.analysis.output)} tokens • {formatCost(costs.analysis.cost)}
            </span>
          </div>
        )}

        {/* Table Extraction */}
        {costs.extraction.calls > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-blue-800">
              Table Extraction:
              <span className="text-blue-600 text-xs ml-1">({costs.extraction.calls} table{costs.extraction.calls > 1 ? 's' : ''})</span>
            </span>
            <span className="font-mono text-blue-900">
              {formatTokens(costs.extraction.input + costs.extraction.output)} tokens • {formatCost(costs.extraction.cost)}
            </span>
          </div>
        )}

        {/* FAIR Analysis */}
        {costs.fair_analysis.calls > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-blue-800">
              FAIR Analysis:
              <span className="text-blue-600 text-xs ml-1">({costs.fair_analysis.calls} call{costs.fair_analysis.calls > 1 ? 's' : ''})</span>
            </span>
            <span className="font-mono text-blue-900">
              {formatTokens(costs.fair_analysis.input + costs.fair_analysis.output)} tokens • {formatCost(costs.fair_analysis.cost)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center font-bold text-blue-900 pt-2 border-t border-blue-300">
          <span>Total Cost:</span>
          <span className="font-mono">{formatCost(costs.total)}</span>
        </div>

        {/* Token Breakdown */}
        <div className="text-xs text-blue-700 pt-2 border-t border-blue-200 space-y-1">
          <div className="flex justify-between">
            <span>Input tokens:</span>
            <span className="font-mono">{formatTokens(totalInput)}</span>
          </div>
          <div className="flex justify-between">
            <span>Output tokens:</span>
            <span className="font-mono">{formatTokens(totalOutput)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total tokens:</span>
            <span className="font-mono">{formatTokens(costs.total_tokens)}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-blue-600 mt-3 pt-3 border-t border-blue-200">
        Model: {costs.model.replace('claude-sonnet-4-5-', 'Claude Sonnet 4.5 (')} •
        Pricing: $3/M input, $15/M output tokens
      </p>
    </div>
  );
}
