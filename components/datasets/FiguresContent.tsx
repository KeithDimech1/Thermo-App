'use client';

import Image from 'next/image';
import { DataFile } from '@/lib/types/thermo-data';
import { useLanguage } from '@/lib/context/LanguageContext';
import LanguageToggle from '@/components/ui/LanguageToggle';

interface FiguresContentProps {
  figureFiles: DataFile[];
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FiguresContent({ figureFiles }: FiguresContentProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{t('figures')}</h2>
        <LanguageToggle />
      </div>

      {figureFiles.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">{t('noFigureImages')}</p>
        </div>
      ) : (
        <div className="border rounded-lg p-5 bg-purple-50 border-purple-200">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mt-1">{t('figureImagesFromPaper')}</p>
          </div>

          <div className="space-y-6">
            {figureFiles.map(file => (
              <div
                key={file.id}
                className="p-4 bg-white rounded-lg border border-gray-200"
              >
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {file.display_name || file.file_name}
                    </span>
                  </div>

                  {file.description && (
                    <p className="text-sm text-gray-700 mb-2 italic border-l-4 border-amber-500 pl-3">
                      {file.description}
                    </p>
                  )}

                  <div className="flex gap-4 text-xs text-gray-500 mb-3">
                    {file.file_size_bytes && (
                      <span>{formatFileSize(file.file_size_bytes)}</span>
                    )}
                  </div>
                </div>

                <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <Image
                    src={file.file_path.startsWith('http') ? file.file_path : `/${file.file_path}`}
                    alt={file.description || file.display_name || file.file_name}
                    width={800}
                    height={600}
                    className="w-full h-auto"
                    unoptimized
                  />
                </div>

                <div className="flex justify-end">
                  <a
                    href={file.file_path}
                    download={file.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold"
                  >
                    {t('download')}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
