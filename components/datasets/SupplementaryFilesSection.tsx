'use client';

import { useState, useEffect } from 'react';

interface SupplementaryFile {
  id: number;
  file_name: string;
  file_type: string;
  category: string;
  upload_status: string;
  display_name: string | null;
  description: string | null;
  is_folder: boolean;
  file_path: string;
  source_url: string | null;
  upload_notes: string | null;
}

interface SupplementaryFilesSectionProps {
  datasetId: number;
  supplementaryFilesUrl?: string | null;
}

export default function SupplementaryFilesSection({ datasetId, supplementaryFilesUrl }: SupplementaryFilesSectionProps) {
  const [files, setFiles] = useState<SupplementaryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSupplementaryFiles() {
      try {
        const response = await fetch(`/api/datasets/${datasetId}/supplementary-files`);
        if (!response.ok) {
          throw new Error('Failed to fetch supplementary files');
        }
        const data = await response.json();
        setFiles(data.files || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSupplementaryFiles();
  }, [datasetId]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading supplementary files...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">Error loading files: {error}</div>;
  }

  const availableFiles = files.filter(f => f.upload_status === 'available');
  const externalOnlyFiles = files.filter(f => f.upload_status === 'external_only');
  const hasSupplementaryData = files.length > 0;

  // Determine overall upload status
  const uploadStatus = availableFiles.length > 0 && externalOnlyFiles.length === 0
    ? 'uploaded'
    : availableFiles.length > 0
    ? 'partial'
    : 'not_uploaded';

  if (!hasSupplementaryData && !supplementaryFilesUrl) {
    return null; // No supplementary data available
  }

  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          📊 Supplementary Data
        </h2>

        {/* Upload Status Badge */}
        {hasSupplementaryData && (
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            uploadStatus === 'uploaded'
              ? 'bg-green-100 text-green-800'
              : uploadStatus === 'partial'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {uploadStatus === 'uploaded' && '✅ Uploaded'}
            {uploadStatus === 'partial' && '⚠️ Partially Available'}
            {uploadStatus === 'not_uploaded' && '❌ Not Uploaded'}
          </div>
        )}
      </div>

      {/* External Repository Link */}
      {supplementaryFilesUrl && (
        <div className="mb-4 p-4 bg-white rounded-md border border-blue-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">External Data Repository</p>
          <a
            href={supplementaryFilesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
          >
            {supplementaryFilesUrl}
          </a>
        </div>
      )}

      {/* Available Files */}
      {availableFiles.length > 0 && (
        <div className="mb-4">
          <h3 className="text-md font-semibold text-gray-800 mb-3">Available in Our Database ({availableFiles.length} files)</h3>
          <div className="space-y-2">
            {availableFiles.map(file => (
              <div key={file.id} className="p-3 bg-white rounded-md border border-blue-100 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{file.is_folder ? '📁' : '📄'}</span>
                      <span className="font-semibold text-gray-900">{file.display_name || file.file_name}</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{file.file_type}</span>
                    </div>
                    {file.description && (
                      <p className="text-sm text-gray-600 mt-1 ml-7">{file.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => window.open(file.file_path, '_blank')}
                    className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External-Only Files */}
      {externalOnlyFiles.length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-gray-800 mb-3">Available from External Repository ({externalOnlyFiles.length} files)</h3>
          <div className="space-y-2">
            {externalOnlyFiles.map(file => (
              <div key={file.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{file.is_folder ? '📁' : '📄'}</span>
                      <span className="font-semibold text-gray-700">{file.display_name || file.file_name}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">{file.file_type}</span>
                    </div>
                    {file.description && (
                      <p className="text-sm text-gray-600 mt-1 ml-7">{file.description}</p>
                    )}
                    {file.upload_notes && (
                      <p className="text-xs text-gray-500 mt-1 ml-7 italic">{file.upload_notes}</p>
                    )}
                  </div>
                  {file.source_url && (
                    <a
                      href={file.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
                    >
                      External Link
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
