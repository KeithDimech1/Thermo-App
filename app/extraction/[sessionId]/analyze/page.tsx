'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ExtractionSession, PaperMetadata, TableInfo } from '@/lib/types/extraction-types';

interface PageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

interface AnalysisResult {
  success: boolean;
  sessionId: string;
  paper_metadata: PaperMetadata;
  tables_found: number;
  data_types: string[];
  quality_score: number;
  tables: TableInfo[];
}

export default function AnalyzePage({ params }: PageProps) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<ExtractionSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
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

        // If already analyzed, fetch results from session
        if (data.session.state === 'analyzed' && data.session.paper_metadata) {
          setAnalysisResult({
            success: true,
            sessionId: data.session.session_id,
            paper_metadata: data.session.paper_metadata,
            tables_found: data.session.tables_found || 0,
            data_types: data.session.data_types || [],
            quality_score: 0, // Not stored in session yet
            tables: [], // Not stored in session yet
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

  // Trigger analysis
  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`/api/extraction/${sessionId}/analyze`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Analysis failed');
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);

      // Refresh session to get updated state
      const sessionResponse = await fetch(`/api/extraction/${sessionId}`);
      const sessionData = await sessionResponse.json();
      setSession(sessionData.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // Discard session
  const handleDiscard = async () => {
    if (!confirm('Are you sure you want to discard this session? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/extraction/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      router.push('/upload');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discard session');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-xl text-slate-600">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-xl text-red-600">Session not found</div>
        <Link href="/upload" className="text-blue-600 hover:underline mt-4 inline-block">
          Upload a new paper
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Analysis Stage
        </h1>
        <p className="text-slate-600">
          Session: <span className="font-mono text-sm">{session.session_id}</span>
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-3xl">❌</div>
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-1">Analysis Failed</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Progress */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 mb-1">✅ Step 1</div>
          <div className="text-sm font-semibold text-slate-900">Upload</div>
          <div className="text-xs text-slate-600 mt-1">Complete</div>
        </div>
        <div className={`rounded-lg p-4 border-2 ${
          session.state === 'analyzed' || analysisResult
            ? 'bg-green-100 border-green-400'
            : analyzing
            ? 'bg-blue-100 border-blue-400'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`text-2xl font-bold mb-1 ${
            session.state === 'analyzed' || analysisResult
              ? 'text-green-600'
              : analyzing
              ? 'text-blue-600'
              : 'text-slate-400'
          }`}>
            {session.state === 'analyzed' || analysisResult ? '✅' : analyzing ? '⏳' : ''} Step 2
          </div>
          <div className="text-sm font-semibold text-slate-900">Analyze</div>
          <div className="text-xs text-slate-600 mt-1">
            {session.state === 'analyzed' || analysisResult
              ? 'Complete'
              : analyzing
              ? 'In Progress...'
              : 'Ready'}
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 opacity-50">
          <div className="text-2xl font-bold text-slate-400 mb-1">Step 3</div>
          <div className="text-sm font-semibold text-slate-700">Extract</div>
          <div className="text-xs text-slate-600 mt-1">Pending</div>
        </div>
      </div>

      {/* Session Details */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          PDF Details
        </h3>

        <dl className="space-y-3">
          <div className="flex border-b border-slate-100 pb-3">
            <dt className="w-48 font-medium text-slate-700">Filename:</dt>
            <dd className="text-slate-900">{session.pdf_filename}</dd>
          </div>

          <div className="flex border-b border-slate-100 pb-3">
            <dt className="w-48 font-medium text-slate-700">File Size:</dt>
            <dd className="text-slate-900">
              {(session.pdf_size_bytes / 1024 / 1024).toFixed(2)} MB
            </dd>
          </div>

          <div className="flex border-b border-slate-100 pb-3">
            <dt className="w-48 font-medium text-slate-700">State:</dt>
            <dd>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                session.state === 'analyzed'
                  ? 'bg-green-100 text-green-800'
                  : session.state === 'analyzing'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-800'
              }`}>
                {session.state}
              </span>
            </dd>
          </div>

          <div className="flex">
            <dt className="w-48 font-medium text-slate-700">Uploaded:</dt>
            <dd className="text-slate-900">
              {new Date(session.created_at).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-4xl">✅</div>
            <div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                Analysis Complete!
              </h2>
              <p className="text-green-800">
                Paper analyzed successfully. Review the results below and proceed to extraction.
              </p>
            </div>
          </div>

          {/* Paper Metadata */}
          <div className="bg-white rounded-lg p-5 mb-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Paper Metadata</h3>
            <dl className="space-y-3">
              <div className="flex border-b border-slate-100 pb-3">
                <dt className="w-48 font-medium text-slate-700">Title:</dt>
                <dd className="text-slate-900 flex-1">{analysisResult.paper_metadata.title}</dd>
              </div>
              {analysisResult.paper_metadata.authors && (
                <div className="flex border-b border-slate-100 pb-3">
                  <dt className="w-48 font-medium text-slate-700">Authors:</dt>
                  <dd className="text-slate-900 flex-1">
                    {analysisResult.paper_metadata.authors.join(', ')}
                  </dd>
                </div>
              )}
              {analysisResult.paper_metadata.journal && (
                <div className="flex border-b border-slate-100 pb-3">
                  <dt className="w-48 font-medium text-slate-700">Journal:</dt>
                  <dd className="text-slate-900">{analysisResult.paper_metadata.journal}</dd>
                </div>
              )}
              {analysisResult.paper_metadata.year && (
                <div className="flex border-b border-slate-100 pb-3">
                  <dt className="w-48 font-medium text-slate-700">Year:</dt>
                  <dd className="text-slate-900">{analysisResult.paper_metadata.year}</dd>
                </div>
              )}
              {analysisResult.paper_metadata.doi && (
                <div className="flex border-b border-slate-100 pb-3">
                  <dt className="w-48 font-medium text-slate-700">DOI:</dt>
                  <dd className="text-slate-900 font-mono text-sm">{analysisResult.paper_metadata.doi}</dd>
                </div>
              )}
              {analysisResult.paper_metadata.study_location && (
                <div className="flex border-b border-slate-100 pb-3">
                  <dt className="w-48 font-medium text-slate-700">Study Location:</dt>
                  <dd className="text-slate-900">{analysisResult.paper_metadata.study_location}</dd>
                </div>
              )}
              {analysisResult.paper_metadata.mineral && (
                <div className="flex border-b border-slate-100 pb-3">
                  <dt className="w-48 font-medium text-slate-700">Mineral:</dt>
                  <dd className="text-slate-900">{analysisResult.paper_metadata.mineral}</dd>
                </div>
              )}
              {analysisResult.paper_metadata.sample_count !== undefined && (
                <div className="flex">
                  <dt className="w-48 font-medium text-slate-700">Sample Count:</dt>
                  <dd className="text-slate-900">{analysisResult.paper_metadata.sample_count}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Tables & Data Types */}
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white rounded-lg p-5">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Tables Found</h3>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {analysisResult.tables_found}
              </div>
              {analysisResult.tables.length > 0 && (
                <ul className="space-y-2 text-sm">
                  {analysisResult.tables.map((table) => (
                    <li key={table.table_number} className="text-slate-700">
                      <span className="font-semibold">Table {table.table_number}:</span> {table.data_type}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-lg p-5">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Data Types</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.data_types.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analyzing State */}
      {analyzing && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl animate-pulse">⏳</div>
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-2">
                Analyzing Paper...
              </h2>
              <p className="text-blue-800 mb-3">
                This may take 1-2 minutes. Claude is extracting text from the PDF and analyzing its contents.
              </p>
              <ul className="space-y-2 text-blue-700 text-sm">
                <li className="flex items-center gap-2">
                  <span className="animate-pulse">•</span>
                  Extracting PDF text with PyMuPDF
                </li>
                <li className="flex items-center gap-2">
                  <span className="animate-pulse">•</span>
                  Sending to Claude API for analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="animate-pulse">•</span>
                  Detecting tables and extracting metadata
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        {!analysisResult && !analyzing && (
          <button
            onClick={handleAnalyze}
            disabled={session.state === 'analyzing'}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze Paper
          </button>
        )}

        {analysisResult && (
          <>
            <button
              onClick={() => {
                const tablesParam = encodeURIComponent(JSON.stringify(analysisResult.tables));
                router.push(`/extraction/${sessionId}/extract?tables=${tablesParam}`);
              }}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
            >
              Proceed to Extraction
            </button>
            <button
              onClick={handleDiscard}
              className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
            >
              Discard Session
            </button>
          </>
        )}

        {!analyzing && (
          <Link
            href="/upload"
            className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition"
          >
            Upload Another Paper
          </Link>
        )}
      </div>
    </div>
  );
}
