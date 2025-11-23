'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FairAnalysisButtonProps {
  datasetId: string;
  hasFairScore: boolean;
}

export default function FairAnalysisButton({ datasetId, hasFairScore }: FairAnalysisButtonProps) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`/api/datasets/${datasetId}/fair/analyze`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Analysis failed');
      }

      const result = await response.json();
      console.log('FAIR analysis complete:', result);

      // Refresh the page to show updated results
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {hasFairScore ? '🔄 Re-run FAIR Analysis' : '📊 Run FAIR Analysis'}
          </h3>
          <p className="text-gray-700 text-sm mb-4">
            {hasFairScore
              ? 'Update the FAIR compliance assessment with the latest data and standards.'
              : 'Analyze the dataset CSVs against Kohn 2024 standards and generate a FAIR compliance score.'}
          </p>
          <div className="flex items-start gap-2 text-xs text-gray-600 mb-4">
            <span>✓</span>
            <div>
              <p className="font-semibold mb-1">What this does:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Reviews paper metadata from paper-index.md</li>
                <li>Analyzes CSV data files for completeness</li>
                <li>Validates against Kohn et al. (2024) reporting standards</li>
                <li>Calculates FAIR compliance score (Findable, Accessible, Interoperable, Reusable)</li>
                <li>Generates field-level compliance breakdown</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="ml-6">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Analyzing...
              </span>
            ) : (
              hasFairScore ? 'Re-analyze' : 'Analyze Now'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm font-medium">⚠️ {error}</p>
        </div>
      )}

      {isAnalyzing && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
          <p className="text-blue-800 text-sm">
            ⏳ Analyzing dataset... This may take a few moments.
          </p>
        </div>
      )}
    </div>
  );
}
