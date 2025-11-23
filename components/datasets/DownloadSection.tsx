'use client';

import { useState } from 'react';
import { DataFile } from '@/lib/types/thermo-data';
import { FILE_GROUP_CONFIG } from '@/lib/constants/file-types';
import CSVPreviewModal from './CSVPreviewModal';
import ExcelJS from 'exceljs';
import { parse } from 'csv-parse/sync';

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
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);
  const [exportingXLSX, setExportingXLSX] = useState<number | null>(null);

  // Group files by type using centralized configuration
  const fileGroups: FileGroup[] = FILE_GROUP_CONFIG.map(config => ({
    type: config.type,
    title: config.title,
    description: config.description,
    colorClass: config.colorClass,
    icon: config.icon,
    files: files.filter(f => f.file_type === config.type),
  })).filter(group => group.files.length > 0); // Only show groups with files

  const handlePreview = (file: DataFile) => {
    setPreviewFile({ url: file.file_path, name: file.file_name });
  };

  const handleDownloadXLSX = async (file: DataFile) => {
    setExportingXLSX(file.id);

    try {
      // 1. Fetch CSV from Supabase
      const response = await fetch(file.file_path);
      if (!response.ok) {
        throw new Error('Failed to fetch CSV file');
      }

      const csvText = await response.text();

      // 2. Parse CSV using csv-parse library
      const rows = parse(csvText, {
        skip_empty_lines: true,
        relax_column_count: true,
      }) as string[][];

      // 3. Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');

      // Add rows
      worksheet.addRows(rows);

      // 4. Apply formatting

      // Bold headers (first row)
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' }, // Light gray background
      };

      // Freeze top row
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      // Auto-width columns
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: false }, (cell) => {
          const cellValue = cell.value?.toString() || '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50); // Min 10, max 50
      });

      // Add borders to all cells
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          };
        });
      });

      // 5. Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name.replace('.csv', '.xlsx');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('XLSX export error:', error);
      alert('Failed to export XLSX. Please try again.');
    } finally {
      setExportingXLSX(null);
    }
  };

  return (
    <>
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

                      {/* Action Buttons - Different for CSV vs other files */}
                      {file.file_type === 'csv' ? (
                        <div className="flex gap-2">
                          {/* Preview Button */}
                          <button
                            onClick={() => handlePreview(file)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold whitespace-nowrap flex items-center gap-1"
                          >
                            <span>🔍</span>
                            <span className="hidden sm:inline">Preview</span>
                          </button>

                          {/* Download XLSX Button */}
                          <button
                            onClick={() => handleDownloadXLSX(file)}
                            disabled={exportingXLSX === file.id}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold whitespace-nowrap flex items-center gap-1 disabled:bg-gray-400"
                          >
                            {exportingXLSX === file.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span className="hidden sm:inline">Exporting...</span>
                              </>
                            ) : (
                              <>
                                <span>📊</span>
                                <span className="hidden sm:inline">XLSX</span>
                              </>
                            )}
                          </button>

                          {/* Download CSV Button */}
                          <a
                            href={file.file_path}
                            download={file.file_name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold whitespace-nowrap flex items-center gap-1"
                          >
                            <span>📄</span>
                            <span className="hidden sm:inline">CSV</span>
                          </a>
                        </div>
                      ) : (
                        <a
                          href={file.file_path}
                          download={file.file_name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold whitespace-nowrap"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* CSV Preview Modal */}
      {previewFile && (
        <CSVPreviewModal
          isOpen={true}
          onClose={() => setPreviewFile(null)}
          fileUrl={previewFile.url}
          fileName={previewFile.name}
        />
      )}
    </>
  );
}
