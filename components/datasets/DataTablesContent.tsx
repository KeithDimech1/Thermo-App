'use client';

import Image from 'next/image';
import { DataFile } from '@/lib/types/thermo-data';
import CSVActions from '@/components/datasets/CSVActions';
import { useLanguage } from '@/lib/context/LanguageContext';

interface TablePair {
  tableName: string;
  image?: DataFile;
  csv?: DataFile;
  caption?: string;
}

interface DataTablesContentProps {
  tablePairs: TablePair[];
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DataTablesContent({ tablePairs }: DataTablesContentProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('dataTables')}</h2>
        <p className="text-sm text-gray-600">
          {t('tableScreenshotPairedData')}
        </p>
      </div>

      {tablePairs.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">{t('noTableDataAvailable')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {tablePairs.map((pair, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-6 bg-white shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {pair.tableName}
              </h3>

              {pair.caption && (
                <p className="text-sm text-gray-700 mb-4 italic border-l-4 border-amber-500 pl-3">
                  {pair.caption}
                </p>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Table Image */}
                {pair.image && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-700">
                        {t('tableScreenshot')}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(pair.image.file_size_bytes)}
                      </span>
                    </div>

                    <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                      <Image
                        src={pair.image.file_path.startsWith('http') ? pair.image.file_path : `/${pair.image.file_path}`}
                        alt={pair.caption || pair.tableName}
                        width={600}
                        height={400}
                        className="w-full h-auto"
                        unoptimized
                      />
                    </div>

                    <a
                      href={pair.image.file_path}
                      download={pair.image.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                    >
                      {t('downloadImage')}
                    </a>
                  </div>
                )}

                {/* CSV Data */}
                {pair.csv && (
                  <CSVActions csvFile={pair.csv} />
                )}

                {/* If only image, no CSV */}
                {pair.image && !pair.csv && (
                  <div className="flex items-center justify-center bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        {t('noCSVExtracted')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('downloadImageToView')}
                      </p>
                    </div>
                  </div>
                )}

                {/* If only CSV, no image */}
                {pair.csv && !pair.image && (
                  <div className="flex items-center justify-center bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        {t('noTableScreenshot')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('downloadCSVToView')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
