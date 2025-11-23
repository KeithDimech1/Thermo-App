'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ExtractionSession, PaperMetadata, TableInfo } from '@/lib/types/extraction-types';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// Helper function to convert file path to Supabase public URL
function getPublicUrl(filePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucket = 'extractions';

  if (!supabaseUrl) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL not set, using file path as-is');
    return filePath;
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
}

interface PageProps{
  params: Promise<{
    sessionId: string;
  }>;
}

interface AnalysisResult {
  success: boolean;
  sessionId: string;
  paper_metadata: PaperMetadata;
  tables_found: number;
  figures_found: number;
  tables: TableInfo[];
  figures?: Array<{
    figure_number: number | string;
    caption: string;
    page_number?: number;
  }>;
}

export default function AnalyzePage({ params }: PageProps) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<ExtractionSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Screenshot generation state
  const [generatingScreenshots, setGeneratingScreenshots] = useState(false);
  const [screenshotProgress, setScreenshotProgress] = useState({ current: 0, total: 0 });
  const [screenshotsGenerated, setScreenshotsGenerated] = useState(false);

  // Live log state
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (message: string) => {
    setLogs((prev) => [...prev.slice(-4), message]); // Keep last 5 messages
  };

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
            figures_found: 0, // Not stored in session yet
            tables: [], // Not stored in session yet
            figures: [],
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
    setLogs([]);

    try {
      addLog('📄 Extracting PDF text...');

      const response = await fetch(`/api/extraction/${sessionId}/analyze`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Analysis failed');
      }

      addLog('🤖 Sending to Claude API for analysis...');
      const result: AnalysisResult = await response.json();

      addLog(`✓ Found ${result.tables_found} tables, ${result.figures_found} figures`);
      setAnalysisResult(result);

      // Refresh session to get updated state
      const sessionResponse = await fetch(`/api/extraction/${sessionId}`);
      const sessionData = await sessionResponse.json();
      setSession(sessionData.session);

      // Generate screenshots for tables
      if (result.tables && result.tables.length > 0) {
        addLog(`📸 Generating screenshots for ${result.tables.length} tables...`);
        await generateTableScreenshots(result.tables);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      addLog(`❌ Error: ${err instanceof Error ? err.message : 'Analysis failed'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate screenshots of table pages using PDF.js in the browser
  const generateTableScreenshots = async (tables: TableInfo[]) => {
    setGeneratingScreenshots(true);
    setScreenshotProgress({ current: 0, total: tables.length });
    setError(null);

    try {
      addLog('⬇️ Downloading PDF...');

      // Download PDF via authenticated API endpoint
      const pdfResponse = await fetch(`/api/extraction/${sessionId}/pdf`);
      if (!pdfResponse.ok) {
        const errorData = await pdfResponse.json();
        throw new Error(errorData.details || 'Failed to download PDF');
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();
      addLog(`✓ PDF loaded (${(pdfBuffer.byteLength / 1024).toFixed(0)} KB)`);

      // Load PDF using PDF.js
      const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
      const pdf = await loadingTask.promise;

      // Process each table
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        if (!table || !table.page_number) {
          console.warn(`Table ${table?.table_number || i} has no page number, skipping screenshot`);
          continue;
        }

        setScreenshotProgress({ current: i + 1, total: tables.length });
        addLog(`📸 Rendering table ${table.table_number} (page ${table.page_number})...`);

        // Get page
        const page = await pdf.getPage(table.page_number);
        const viewport = page.getViewport({ scale: 2.0 });

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Failed to get canvas context');
        }

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          }, 'image/png');
        });

        // Upload via authenticated API endpoint
        const uploadResponse = await fetch(
          `/api/extraction/${sessionId}/upload-screenshot?table=${table.table_number}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'image/png',
            },
            body: blob,
          }
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          console.error(`Failed to upload screenshot for table ${table.table_number}:`, errorData);
          throw new Error(errorData.details || 'Upload failed');
        }

        addLog(`✓ Uploaded table ${table.table_number} screenshot`);
      }

      addLog(`✅ All screenshots generated successfully`);
      setScreenshotsGenerated(true);
    } catch (err) {
      console.error('Screenshot generation failed:', err);
      setError(`Screenshot generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGeneratingScreenshots(false);
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
                <div className="flex border-b border-slate-100 pb-3">
                  <dt className="w-48 font-medium text-slate-700">Sample Count:</dt>
                  <dd className="text-slate-900">{analysisResult.paper_metadata.sample_count}</dd>
                </div>
              )}
              {analysisResult.paper_metadata.supplementary_data_url && (
                <div className="flex">
                  <dt className="w-48 font-medium text-slate-700">Supplementary Data:</dt>
                  <dd>
                    <a
                      href={analysisResult.paper_metadata.supplementary_data_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                    >
                      <span>View supplementary materials</span>
                      <span className="text-sm">↗</span>
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Tables & Figures */}
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
                      <span className="font-semibold">Table {table.table_number}:</span>{' '}
                      {table.caption ? table.caption.substring(0, 60) + (table.caption.length > 60 ? '...' : '') : 'No caption'}
                      {table.page_number && <span className="text-slate-500 ml-2">(p. {table.page_number})</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-lg p-5">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Figures Found</h3>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {analysisResult.figures_found}
              </div>
              {analysisResult.figures && analysisResult.figures.length > 0 && (
                <ul className="space-y-2 text-sm">
                  {analysisResult.figures.slice(0, 5).map((fig) => (
                    <li key={fig.figure_number} className="text-slate-700">
                      <span className="font-semibold">Figure {fig.figure_number}</span>
                      {fig.page_number && <span className="text-slate-500 ml-2">(p. {fig.page_number})</span>}
                    </li>
                  ))}
                  {analysisResult.figures.length > 5 && (
                    <li className="text-slate-500 text-xs">+ {analysisResult.figures.length - 5} more</li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Generated Files */}
          <div className="bg-white rounded-lg p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Generated Files</h3>
            <p className="text-slate-600 text-sm mb-4">
              Analysis complete! The following files have been generated and are available for review:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <a
                href={getPublicUrl(`${sessionId}/paper-index.md`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                <span className="text-2xl">📄</span>
                <div>
                  <div className="font-semibold text-slate-900">paper-index.md</div>
                  <div className="text-xs text-slate-500">Quick reference guide</div>
                </div>
              </a>

              <a
                href={getPublicUrl(`${sessionId}/tables.md`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-semibold text-slate-900">tables.md</div>
                  <div className="text-xs text-slate-500">Visual table reference</div>
                </div>
              </a>

              <a
                href={getPublicUrl(`${sessionId}/table-index.json`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                <span className="text-2xl">🗂️</span>
                <div>
                  <div className="font-semibold text-slate-900">table-index.json</div>
                  <div className="text-xs text-slate-500">Structured metadata</div>
                </div>
              </a>

              <a
                href={`/uploads/${sessionId}/text/plain-text.txt`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                <span className="text-2xl">📝</span>
                <div>
                  <div className="font-semibold text-slate-900">plain-text.txt</div>
                  <div className="text-xs text-slate-500">Extracted PDF text</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Analyzing State - Live Logs */}
      {analyzing && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl animate-pulse">⏳</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">
                Analyzing Paper...
              </h2>
              <p className="text-blue-800 mb-4">
                Live progress (last 5 messages):
              </p>
              <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded border border-gray-700 max-h-32 overflow-hidden">
                {logs.length === 0 ? (
                  <div className="text-gray-500">Starting analysis...</div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <div key={index} className="truncate">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Generation State */}
      {generatingScreenshots && (
        <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl animate-pulse">📸</div>
            <div>
              <h2 className="text-2xl font-bold text-purple-900 mb-2">
                Generating Table Screenshots...
              </h2>
              <p className="text-purple-800 mb-3">
                Creating high-quality images of each table for accurate extraction.
              </p>
              <div className="text-purple-700 text-sm mb-2">
                Progress: {screenshotProgress.current} / {screenshotProgress.total} tables
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${screenshotProgress.total > 0 ? (screenshotProgress.current / screenshotProgress.total) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screenshots Generated Success */}
      {screenshotsGenerated && !generatingScreenshots && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-3xl">✅</div>
            <div>
              <h3 className="text-lg font-bold text-green-900 mb-1">Screenshots Generated!</h3>
              <p className="text-green-800">
                {screenshotProgress.total} table screenshot(s) created successfully. Ready for extraction!
              </p>
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
            {analysisResult.tables_found > 0 ? (
              <button
                onClick={() => {
                  const tablesParam = encodeURIComponent(JSON.stringify(analysisResult.tables));
                  router.push(`/extraction/${sessionId}/extract?tables=${tablesParam}`);
                }}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                Proceed to Extraction ({analysisResult.tables_found} {analysisResult.tables_found === 1 ? 'table' : 'tables'})
              </button>
            ) : (
              <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">No Tables Detected</h4>
                  <p className="text-sm text-yellow-800">
                    This paper has no extractable tables, but you can still load the metadata, figures, and supplementary materials.
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => router.push(`/extraction/${sessionId}/load`)}
              className={`px-6 py-3 font-semibold rounded-lg transition ${
                analysisResult.tables_found === 0
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {analysisResult.tables_found === 0 ? 'Load Metadata & Files' : 'Skip to Load (No Extraction)'}
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
