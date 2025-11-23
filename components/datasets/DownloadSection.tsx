import { DataFile } from '@/lib/types/thermo-data';
import { FILE_GROUP_CONFIG } from '@/lib/constants/file-types';

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
  icon: string;
}

export default function DownloadSection({ files }: DownloadSectionProps) {
  // Group files by type using centralized configuration
  const fileGroups: FileGroup[] = FILE_GROUP_CONFIG.map(config => ({
    type: config.type,
    title: config.title,
    description: config.description,
    colorClass: config.colorClass,
    icon: config.icon,
    files: files.filter(f => f.file_type === config.type),
  })).filter(group => group.files.length > 0); // Only show groups with files

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
                      href={file.file_path}
                      download={file.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
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
