import { DataFile } from '@/lib/types/thermo-data';

interface DownloadSectionProps {
  files: DataFile[];
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileGroup {
  type: string;
  title: string;
  description: string;
  files: DataFile[];
  colorClass: string;
}

export default function DownloadSection({ files }: DownloadSectionProps) {
  // Group files by type
  const fileGroups: FileGroup[] = [
    {
      type: 'RAW',
      title: 'Raw Data Files',
      description: 'Original data extracted directly from paper tables',
      files: files.filter(f => f.file_type === 'RAW'),
      colorClass: 'bg-blue-50 border-blue-200'
    },
    {
      type: 'EarthBank',
      title: 'EarthBank/FAIR Data',
      description: 'FAIR-compliant data formatted for EarthBank platform',
      files: files.filter(f => f.file_type === 'EarthBank'),
      colorClass: 'bg-green-50 border-green-200'
    },
    {
      type: 'PDF',
      title: 'PDF Documents',
      description: 'Research paper and supplementary tables',
      files: files.filter(f => f.file_type === 'PDF'),
      colorClass: 'bg-red-50 border-red-200'
    },
    {
      type: 'Images',
      title: 'Figures & Images',
      description: 'Extracted figures and diagrams from the paper',
      files: files.filter(f => f.file_type === 'Images'),
      colorClass: 'bg-purple-50 border-purple-200'
    }
  ].filter(group => group.files.length > 0); // Only show groups with files

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Download All</h2>

      {files.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">No data files available for download.</p>
        </div>
      ) : (
        <>
          {/* File Groups */}
          {fileGroups.map(group => (
            <div key={group.type} className={`border rounded-lg p-5 ${group.colorClass}`}>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">{group.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{group.description}</p>
              </div>

              <div className="space-y-2">
                {group.files.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {file.display_name || file.file_name}
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
                      href={`/api/datasets/files/${file.id}`}
                      download={file.file_name}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold whitespace-nowrap"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
