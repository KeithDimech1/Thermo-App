'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { ExtractionSession, TableInfo } from '@/lib/types/extraction-types';

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

interface PageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

interface ExtractionResult {
  success: boolean;
  sessionId: string;
  tableNumber: number;
  csvData: Array<Record<string, string>>;
  csvPath: string;
  stats: {
    totalRows: number;
    totalColumns: number;
    completeness: number;
  };
}

interface TableExtractionState {
  status: 'pending' | 'extracting' | 'success' | 'error';
  result?: ExtractionResult;
  error?: string;
}

export default function ExtractPage({ params }: PageProps) {
  const { sessionId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<ExtractionSession | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [extractionStates, setExtractionStates] = useState<Map<number | string, TableExtractionState>>(new Map());
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

        // Parse tables from URL query params (passed from analyze page)
        const tablesParam = searchParams.get('tables');
        if (tablesParam) {
          const parsedTables = JSON.parse(decodeURIComponent(tablesParam));
          setTables(parsedTables);

          // Initialize extraction states
          const initialStates = new Map<number | string, TableExtractionState>();
          parsedTables.forEach((table: TableInfo) => {
            initialStates.set(table.table_number, { status: 'pending' });
          });
          setExtractionStates(initialStates);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId, searchParams]);

  // Extract a single table
  const handleExtractTable = async (table: TableInfo) => {
    // Update state to extracting
    setExtractionStates(prev => new Map(prev).set(table.table_number, { status: 'extracting' }));

    try {
      const response = await fetch(`/api/extraction/${sessionId}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Extraction failed');
      }

      const result: ExtractionResult = await response.json();

      // Update state to success
      setExtractionStates(prev => new Map(prev).set(table.table_number, {
        status: 'success',
        result,
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Extraction failed';

      // Update state to error
      setExtractionStates(prev => new Map(prev).set(table.table_number, {
        status: 'error',
        error: errorMessage,
      }));
    }
  };

  // Extract all tables
  const handleExtractAll = async () => {
    for (const table of tables) {
      const state = extractionStates.get(table.table_number);
      if (state?.status !== 'success') {
        await handleExtractTable(table);
      }
    }
  };

  // Check if all tables are extracted successfully
  const allTablesExtracted = tables.length > 0 && tables.every(table => {
    const state = extractionStates.get(table.table_number);
    return state?.status === 'success';
  });

  // Count extracted tables
  const extractedCount = Array.from(extractionStates.values()).filter(
    state => state.status === 'success'
  ).length;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="text-xl text-slate-600">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="text-xl text-red-600">Session not found</div>
        <Link href="/upload" className="text-blue-600 hover:underline mt-4 inline-block">
          Upload a new paper
        </Link>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="text-xl text-slate-600">No tables found</div>
        <Link href={`/extraction/${sessionId}/analyze`} className="text-blue-600 hover:underline mt-4 inline-block">
          Go back to analysis
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Extract Tables
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
              <h3 className="text-lg font-bold text-red-900 mb-1">Error</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Progress */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 mb-1">✅ Step 1</div>
          <div className="text-sm font-semibold text-slate-900">Analyze</div>
          <div className="text-xs text-slate-600 mt-1">Complete</div>
        </div>
        <div className={`rounded-lg p-4 border-2 ${
          allTablesExtracted
            ? 'bg-green-100 border-green-400'
            : 'bg-blue-100 border-blue-400'
        }`}>
          <div className={`text-2xl font-bold mb-1 ${
            allTablesExtracted ? 'text-green-600' : 'text-blue-600'
          }`}>
            {allTablesExtracted ? '✅' : '⏳'} Step 2
          </div>
          <div className="text-sm font-semibold text-slate-900">Extract</div>
          <div className="text-xs text-slate-600 mt-1">
            {extractedCount} of {tables.length} complete
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 opacity-50">
          <div className="text-2xl font-bold text-slate-400 mb-1">Step 3</div>
          <div className="text-sm font-semibold text-slate-700">Load</div>
          <div className="text-xs text-slate-600 mt-1">Pending</div>
        </div>
      </div>

      {/* Extract All Button */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleExtractAll}
          disabled={allTablesExtracted}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Extract All Tables
        </button>
        {allTablesExtracted && (
          <button
            onClick={() => router.push(`/extraction/${sessionId}/load`)}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
          >
            Proceed to Load Stage
          </button>
        )}
      </div>

      {/* Tables List */}
      <div className="space-y-6">
        {tables.map((table) => {
          const state = extractionStates.get(table.table_number);

          return (
            <div key={table.table_number} className="bg-white border border-slate-200 rounded-lg p-6">
              {/* Table Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      Table {table.table_number}
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                      {table.data_type}
                    </span>
                    {state?.status === 'success' && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                        ✓ Extracted
                      </span>
                    )}
                    {state?.status === 'extracting' && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full animate-pulse">
                        ⏳ Extracting...
                      </span>
                    )}
                    {state?.status === 'error' && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                        ✗ Failed
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 mb-3">{table.caption}</p>
                  <div className="text-sm text-slate-600 flex gap-4">
                    <span>Page: {table.page_number || 'Unknown'}</span>
                    <span>Est. Size: {table.estimated_rows}×{table.estimated_columns}</span>
                  </div>
                </div>

                {/* Extract Button */}
                {state?.status !== 'success' && (
                  <button
                    onClick={() => handleExtractTable(table)}
                    disabled={state?.status === 'extracting'}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state?.status === 'extracting' ? 'Extracting...' : state?.status === 'error' ? 'Retry' : 'Extract'}
                  </button>
                )}
              </div>

              {/* Error Message */}
              {state?.status === 'error' && state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm">
                    <strong>Error:</strong> {state.error}
                  </p>
                </div>
              )}

              {/* Extraction Results */}
              {state?.status === 'success' && state.result && (
                <div className="mt-4 space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm text-slate-600">Rows</div>
                      <div className="text-2xl font-bold text-slate-900">{state.result.stats.totalRows}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm text-slate-600">Columns</div>
                      <div className="text-2xl font-bold text-slate-900">{state.result.stats.totalColumns}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm text-slate-600">Completeness</div>
                      <div className="text-2xl font-bold text-slate-900">
                        {state.result.stats.completeness.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* CSV Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">CSV Preview</h4>
                      <a
                        href={getPublicUrl(state.result.csvPath)}
                        download
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Download CSV
                      </a>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 overflow-x-auto">
                      <table className="text-sm w-full">
                        <thead>
                          <tr className="border-b border-slate-300">
                            {state.result.csvData.length > 0 && state.result.csvData[0] &&
                              Object.keys(state.result.csvData[0]).map(header => (
                                <th key={header} className="text-left p-2 font-semibold text-slate-700">
                                  {header}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                          {state.result.csvData.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-200">
                              {Object.values(row).map((value, colIdx) => (
                                <td key={colIdx} className="p-2 text-slate-800">
                                  {value || <span className="text-slate-400 italic">empty</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {state.result.csvData.length > 5 && (
                        <div className="text-center text-slate-500 text-sm mt-3 italic">
                          ... and {state.result.csvData.length - 5} more rows
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
