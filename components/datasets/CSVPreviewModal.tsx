'use client';

import { useState, useEffect } from 'react';
import { parse } from 'csv-parse/sync';

interface CSVPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

export default function CSVPreviewModal({ isOpen, onClose, fileUrl, fileName }: CSVPreviewModalProps) {
  const [data, setData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadCSV();
    } else {
      // Reset state when modal closes
      setData([]);
      setError(null);
    }
  }, [isOpen, fileUrl]);

  async function loadCSV() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch CSV file');
      }

      const text = await response.text();

      // Parse CSV using csv-parse library (handles quotes, commas in cells, etc.)
      const parsed = parse(text, {
        skip_empty_lines: true,
        relax_column_count: true, // Allow varying column counts
      }) as string[][];

      setTotalRows(parsed.length - 1); // Excluding header

      // Limit to first 101 rows (header + 100 data rows)
      setData(parsed.slice(0, 101));
    } catch (err) {
      console.error('CSV load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load CSV');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{fileName}</h2>
              {totalRows > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {totalRows.toLocaleString()} rows {data.length > 101 && '(showing first 100)'}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading CSV...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {!loading && !error && data.length > 0 && data[0] && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      {data[0].map((header, i) => (
                        <th
                          key={i}
                          className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-900 whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(1).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className="border border-gray-300 px-4 py-2 text-gray-700"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && !error && totalRows > 100 && (
            <div className="p-4 border-t border-gray-200 bg-yellow-50">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Note:</span> Showing first 100 rows of {totalRows.toLocaleString()} total rows
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
