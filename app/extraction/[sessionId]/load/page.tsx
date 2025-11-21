'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import type { ExtractionSession } from '@/lib/types/extraction-types';

interface PageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

interface LoadResponse {
  success: boolean;
  dataset_id: number;
  dataset_name: string;
  fair_score: number;
  fair_grade: string;
  files_uploaded: number;
  total_size_bytes: number;
}

export default function LoadPage({ params }: PageProps) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<ExtractionSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadResult, setLoadResult] = useState<LoadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch session on mount
  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch(`/api/extraction/${sessionId}`);
        if (!response.ok) {
          throw new Error('Session not found');
        }
        const data = await response.json();
        setSession(data.session);

        // If session is already loaded, fetch the result from database
        if (data.session.state === 'loaded' && data.session.dataset_id) {
          // Session already loaded - show completed state
          setLoadResult({
            success: true,
            dataset_id: data.session.dataset_id,
            dataset_name: data.session.paper_metadata?.title || 'Unknown',
            fair_score: data.session.fair_score || 0,
            fair_grade: calculateGrade(data.session.fair_score || 0),
            files_uploaded: 0, // Would need to fetch from data_files
            total_size_bytes: 0
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  const handleLoad = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/extraction/${sessionId}/load`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Load failed');
      }

      const result: LoadResponse = await response.json();
      setLoadResult(result);

      // Update session state
      if (session) {
        setSession({
          ...session,
          state: 'loaded',
          dataset_id: result.dataset_id,
          fair_score: result.fair_score
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Error</div>
          <p className="text-gray-700 mb-4">{error}</p>
          <Link
            href="/upload"
            className="text-blue-600 hover:underline"
          >
            ← Back to Upload
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Session not found</p>
      </div>
    );
  }

  // Check if session is in correct state
  if (session.state !== 'extracted' && session.state !== 'loaded') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-yellow-600 text-xl mb-4">⚠️ Not Ready</div>
          <p className="text-gray-700 mb-4">
            This session is in state "{session.state}". It must be in "extracted" state before loading.
          </p>
          <Link
            href={`/extraction/${sessionId}/extract`}
            className="text-blue-600 hover:underline"
          >
            ← Go to Extraction
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/upload" className="hover:underline">Upload</Link>
            <span>→</span>
            <Link href={`/extraction/${sessionId}/analyze`} className="hover:underline">Analyze</Link>
            <span>→</span>
            <Link href={`/extraction/${sessionId}/extract`} className="hover:underline">Extract</Link>
            <span>→</span>
            <span className="font-semibold text-gray-900">Load</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Step 3: Load to Database</h1>
          <p className="text-gray-600 mt-2">
            Create dataset record and perform FAIR assessment
          </p>
        </div>

        {/* Main Content */}
        {!loadResult ? (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-4">Ready to Load</h2>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">What happens during load:</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                <li>Creates dataset record with paper metadata</li>
                <li>Uploads files to public directory (PDF, CSVs, images)</li>
                <li>Tracks files in database</li>
                <li>Performs FAIR compliance assessment</li>
                <li>Generates FAIR reports</li>
                <li>Calculates Kohn 2024 compliance scores</li>
              </ul>
            </div>

            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Note:</h3>
              <p className="text-yellow-800 text-sm">
                This step does <strong>NOT</strong> import CSV data to database tables (earthbank_*).
                That is a separate workflow. The load stage only creates dataset metadata and performs FAIR assessment.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold mb-2">Session Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Session ID:</span>
                    <span className="ml-2 font-mono text-gray-900">{sessionId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">State:</span>
                    <span className="ml-2 font-semibold text-green-600">{session.state}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">PDF:</span>
                    <span className="ml-2 text-gray-900">{session.pdf_filename}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tables Found:</span>
                    <span className="ml-2 text-gray-900">{session.tables_found || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">CSVs Extracted:</span>
                    <span className="ml-2 text-gray-900">{session.csvs_extracted || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="mt-8 flex gap-4">
              <button
                onClick={handleLoad}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Loading...
                  </span>
                ) : (
                  'Load to Database'
                )}
              </button>

              <Link
                href={`/extraction/${sessionId}/extract`}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back
              </Link>
            </div>
          </div>
        ) : (
          // Success State
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">✅</div>
                <h2 className="text-2xl font-bold text-green-900">Load Complete!</h2>
              </div>
              <p className="text-green-800">
                Dataset created successfully with FAIR assessment
              </p>
            </div>

            {/* Dataset Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Dataset Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600 text-sm">Dataset ID:</span>
                  <p className="font-semibold text-lg">#{loadResult.dataset_id}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Dataset Name:</span>
                  <p className="font-semibold text-lg">{loadResult.dataset_name}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Files Uploaded:</span>
                  <p className="font-semibold text-lg">{loadResult.files_uploaded}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Total Size:</span>
                  <p className="font-semibold text-lg">
                    {(loadResult.total_size_bytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>

            {/* FAIR Score */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">FAIR Compliance Assessment</h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getGradeColor(loadResult.fair_grade)}`}>
                    {loadResult.fair_grade}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">Grade</p>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Overall Score</span>
                    <span className="text-gray-900 font-semibold">{loadResult.fair_score}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${getScoreBarColor(loadResult.fair_score)}`}
                      style={{ width: `${loadResult.fair_score}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    {getScoreDescription(loadResult.fair_score)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href={`/datasets/${loadResult.dataset_id}`}
                  className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">📄</span>
                  <div>
                    <div className="font-semibold">View Dataset</div>
                    <div className="text-sm text-gray-600">See dataset details and metadata</div>
                  </div>
                </Link>

                <Link
                  href={`/datasets/${loadResult.dataset_id}#fair-assessment`}
                  className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="font-semibold">FAIR Assessment</div>
                    <div className="text-sm text-gray-600">Detailed compliance breakdown</div>
                  </div>
                </Link>

                <Link
                  href={`/datasets/${loadResult.dataset_id}#data-files`}
                  className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">📁</span>
                  <div>
                    <div className="font-semibold">View Data Files</div>
                    <div className="text-sm text-gray-600">Browse uploaded files</div>
                  </div>
                </Link>

                <div className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg bg-gray-50 opacity-60">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <div className="font-semibold">Import to Database</div>
                    <div className="text-sm text-gray-600">Coming soon - CSV data import</div>
                  </div>
                </div>
              </div>
            </div>

            {/* New Extraction */}
            <div className="text-center pt-4">
              <Link
                href="/upload"
                className="text-blue-600 hover:underline font-medium"
              >
                ← Start New Extraction
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Functions
function calculateGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-green-600';
    case 'B': return 'text-blue-600';
    case 'C': return 'text-yellow-600';
    case 'D': return 'text-orange-600';
    case 'F': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

function getScoreBarColor(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 80) return 'bg-blue-500';
  if (score >= 70) return 'bg-yellow-500';
  if (score >= 60) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreDescription(score: number): string {
  if (score >= 90) return 'Excellent FAIR compliance';
  if (score >= 80) return 'Good FAIR compliance';
  if (score >= 70) return 'Moderate FAIR compliance';
  if (score >= 60) return 'Basic FAIR compliance';
  return 'Limited FAIR compliance - improvements needed';
}
