'use client';

import { useState } from 'react';
import { DataFile } from '@/lib/types/thermo-data';
import CSVPreviewModal from './CSVPreviewModal';
import ExcelJS from 'exceljs';
import { parse } from 'csv-parse/sync';
import { useLanguage } from '@/lib/context/LanguageContext';

interface CSVActionsProps {
  csvFile: DataFile;
}

export default function CSVActions({ csvFile }: CSVActionsProps) {
  const { t } = useLanguage();
  const [showPreview, setShowPreview] = useState(false);
  const [exportingXLSX, setExportingXLSX] = useState(false);

  const handleDownloadXLSX = async () => {
    setExportingXLSX(true);

    try {
      // 1. Fetch CSV from Supabase
      const response = await fetch(csvFile.file_path);
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
      a.download = csvFile.file_name.replace('.csv', '.xlsx');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('XLSX export error:', error);
      alert('Failed to export XLSX. Please try again.');
    } finally {
      setExportingXLSX(false);
    }
  };

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">
            {t('extractedData')}
          </h4>
          <div className="flex gap-3 text-xs text-gray-500">
            {csvFile.row_count && (
              <span>{csvFile.row_count} {t('rows')}</span>
            )}
            <span>{formatFileSize(csvFile.file_size_bytes)}</span>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-semibold">{t('file')}:</span> {csvFile.file_name}
          </p>
          {csvFile.description && (
            <p className="text-sm text-gray-600">
              {csvFile.description}
            </p>
          )}
        </div>

        {/* Buttons in order: Preview, XLSX, CSV */}
        <div className="flex flex-col gap-2">
          {/* Preview Button */}
          <button
            onClick={() => setShowPreview(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
          >
            <span>🔍</span>
            <span>{t('previewData')}</span>
          </button>

          {/* Download XLSX Button */}
          <button
            onClick={handleDownloadXLSX}
            disabled={exportingXLSX}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            {exportingXLSX ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <span>📊</span>
                <span>{t('downloadXLSX')}</span>
              </>
            )}
          </button>

          {/* Download CSV Button */}
          <a
            href={csvFile.file_path}
            download={csvFile.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
          >
            <span>📄</span>
            <span>{t('downloadCSV')}</span>
          </a>
        </div>
      </div>

      {/* CSV Preview Modal */}
      {showPreview && (
        <CSVPreviewModal
          isOpen={true}
          onClose={() => setShowPreview(false)}
          fileUrl={csvFile.file_path}
          fileName={csvFile.file_name}
        />
      )}
    </>
  );
}
