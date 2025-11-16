import { DataFile } from '@/lib/types/thermo-data';

interface DownloadSectionProps {
  files: DataFile[];
  datasetId: number;
  totalSize: number;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DownloadSection({
  files,
  datasetId,
  totalSize
}: DownloadSectionProps) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">📥 Download Data Files</h2>

      {files.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">No data files available for download.</p>
        </div>
      ) : (
        <>
          {/* Individual Files */}
          <div className="space-y-3 mb-6">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {file.display_name || file.file_name}
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      {file.file_type}
                    </span>
                  </div>

                  {file.description && (
                    <p className="text-xs text-gray-600 mb-1">{file.description}</p>
                  )}

                  <div className="flex gap-4 text-xs text-gray-500">
                    {file.file_size_bytes && (
                      <span>{formatFileSize(file.file_size_bytes)}</span>
                    )}
                    {file.row_count && (
                      <span>{file.row_count} rows</span>
                    )}
                  </div>
                </div>

                <a
                  href={file.file_path}
                  download
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold"
                >
                  Download
                </a>
              </div>
            ))}
          </div>

          {/* Download All Button */}
          <div className="pt-4 border-t border-gray-200">
            <a
              href={`/api/datasets/${datasetId}/download-all`}
              className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center font-semibold"
            >
              📦 Download All as ZIP ({formatFileSize(totalSize)})
            </a>
            <p className="text-xs text-gray-500 text-center mt-2">
              Downloads all {files.length} files in a single ZIP archive
            </p>
          </div>
        </>
      )}
    </div>
  );
}
