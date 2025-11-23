import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDatasetById } from '@/lib/db/earthbank-queries';
import { getDataFilesByDataset } from '@/lib/db/queries';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DatasetTabs from '@/components/datasets/DatasetTabs';
import { extractPaperTitle } from '@/lib/utils/extract-paper-title';
import { FILE_TYPES } from '@/lib/constants/file-types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const dataset = await getDatasetById(id);

  if (!dataset) {
    return {
      title: 'Dataset Not Found',
    };
  }

  return {
    title: `PDFs - ${dataset.datasetName} - AusGeochem`,
    description: `PDF documents for ${dataset.datasetName}`,
  };
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DatasetPdfsPage({ params }: PageProps) {
  const { id } = await params;
  const dataset = await getDatasetById(id);

  if (!dataset) {
    return notFound();
  }

  const datasetIdInt = parseInt(id, 10);
  const allFiles = await getDataFilesByDataset(datasetIdInt);
  const pdfFiles = allFiles.filter(f => f.file_type === FILE_TYPES.PDF);

  const paperTitle = extractPaperTitle(dataset.fullCitation);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[
        { label: 'Datasets', href: '/datasets' },
        { label: dataset.datasetName, href: `/datasets/${id}` },
        { label: 'PDFs' }
      ]} />

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          {dataset.datasetName}
        </h1>
        {paperTitle && (
          <h2 className="text-xl font-bold text-gray-700 mt-2">
            {paperTitle}
          </h2>
        )}
      </div>

      <DatasetTabs datasetId={id} activeTab="pdfs" />

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">PDF Documents</h2>

        {pdfFiles.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-gray-600">No PDF files available.</p>
          </div>
        ) : (
          <div className="border rounded-lg p-5 bg-red-50 border-red-200">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mt-1">Research paper and supplementary materials</p>
            </div>

            <div className="space-y-2">
              {pdfFiles.map(file => (
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
        )}
      </div>
    </div>
  );
}
