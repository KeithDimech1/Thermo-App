import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDatasetById } from '@/lib/db/earthbank-queries';
import { getDataFilesByDataset } from '@/lib/db/queries';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DatasetTabs from '@/components/datasets/DatasetTabs';
import { extractPaperTitle } from '@/lib/utils/extract-paper-title';
import { FILE_TYPES } from '@/lib/constants/file-types';
import Image from 'next/image';

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
    title: `Figures - ${dataset.datasetName} - AusGeochem`,
    description: `Figure images from ${dataset.datasetName}`,
  };
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DatasetFiguresPage({ params }: PageProps) {
  const { id } = await params;
  const dataset = await getDatasetById(id);

  if (!dataset) {
    return notFound();
  }

  const datasetIdInt = parseInt(id, 10);
  const allFiles = await getDataFilesByDataset(datasetIdInt);

  // Filter for figure images (in figures subfolder)
  const figureFiles = allFiles.filter(f =>
    f.file_type === FILE_TYPES.IMAGE_PNG &&
    f.file_path.includes('/figures/')
  );

  const paperTitle = extractPaperTitle(dataset.fullCitation);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[
        { label: 'Datasets', href: '/datasets' },
        { label: dataset.datasetName, href: `/datasets/${id}` },
        { label: 'Figures' }
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

      <DatasetTabs datasetId={id} activeTab="figures" />

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Figures</h2>

        {figureFiles.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-gray-600">No figure images available.</p>
          </div>
        ) : (
          <div className="border rounded-lg p-5 bg-purple-50 border-purple-200">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mt-1">Figure images from the paper</p>
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
                      <p className="text-sm text-gray-700 mb-2 italic">
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
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
