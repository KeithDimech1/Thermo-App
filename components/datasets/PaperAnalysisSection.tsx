'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PaperAnalysisSections {
  executive_summary?: string;
  problem_addressed?: string;
  methods?: string;
  results?: string;
}

interface PaperAnalysisSectionProps {
  sections: PaperAnalysisSections;
}

export default function PaperAnalysisSection({ sections }: PaperAnalysisSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count how many sections are available
  const sectionCount = Object.values(sections).filter(Boolean).length;

  if (sectionCount === 0) {
    return null; // Don't render if no sections available
  }

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div className="text-left">
            <h2 className="text-lg font-bold text-purple-900">Paper Analysis</h2>
            <p className="text-sm text-purple-700">
              {sectionCount} section{sectionCount > 1 ? 's' : ''} available
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-purple-700" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-700" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-6">
          {/* Executive Summary */}
          {sections.executive_summary && (
            <div className="p-6 bg-white border-l-4 border-purple-500 rounded-r-lg shadow-sm">
              <h3 className="text-base font-bold text-purple-900 mb-3">
                1. Executive Summary
              </h3>
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {sections.executive_summary}
              </div>
            </div>
          )}

          {/* Key Problem Addressed */}
          {sections.problem_addressed && (
            <div className="p-6 bg-white border-l-4 border-indigo-500 rounded-r-lg shadow-sm">
              <h3 className="text-base font-bold text-indigo-900 mb-3">
                2. Key Problem Addressed
              </h3>
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {sections.problem_addressed}
              </div>
            </div>
          )}

          {/* Methods/Study Design */}
          {sections.methods && (
            <div className="p-6 bg-white border-l-4 border-blue-500 rounded-r-lg shadow-sm">
              <h3 className="text-base font-bold text-blue-900 mb-3">
                3. Methods/Study Design
              </h3>
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {sections.methods}
              </div>
            </div>
          )}

          {/* Results */}
          {sections.results && (
            <div className="p-6 bg-white border-l-4 border-green-500 rounded-r-lg shadow-sm">
              <h3 className="text-base font-bold text-green-900 mb-3">
                4. Results
              </h3>
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {sections.results}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
