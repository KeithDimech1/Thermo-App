import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDatasetById } from '@/lib/db/earthbank-queries';
import { getDataFilesByDataset } from '@/lib/db/queries';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DatasetTabs from '@/components/datasets/DatasetTabs';
import { extractPaperTitle } from '@/lib/utils/extract-paper-title';
import { FILE_TYPES } from '@/lib/constants/file-types';
import Image from 'next/image';
import { DataFile } from '@/lib/types/thermo-data';

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
    title: `Tables - ${dataset.datasetName} - AusGeochem`,
    description: `Data tables from ${dataset.datasetName}`,
  };
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface TablePair {
  tableName: string;
  image?: DataFile;
  csv?: DataFile;
  caption?: string;
}

function pairTablesWithCsvs(csvFiles: DataFile[], tableImages: DataFile[]): TablePair[] {
  const pairs: TablePair[] = [];
  const processedCsvs = new Set<number>();
  const processedImages = new Set<number>();

  // Extract table number/name from filename (e.g., "table-1.csv" -> "table-1")
  const getTableKey = (filename: string): string => {
    return filename.toLowerCase()
      .replace(/\.(csv|png)$/i, '')
      .replace(/_extracted$/i, '');
  };

  // First pass: match CSVs with images by filename
  for (const csv of csvFiles) {
    const csvKey = getTableKey(csv.file_name);

    // Find matching image
    const matchingImage = tableImages.find(img => {
      const imgKey = getTableKey(img.file_name);
      return imgKey === csvKey;
    });

    pairs.push({
      tableName: csv.display_name || csv.file_name,
      csv,
      image: matchingImage,
      caption: matchingImage?.description || csv.description || undefined
    });

    processedCsvs.add(csv.id);
    if (matchingImage) {
      processedImages.add(matchingImage.id);
    }
  }

  // Second pass: add unpaired images
  for (const image of tableImages) {
    if (!processedImages.has(image.id)) {
      pairs.push({
        tableName: image.display_name || image.file_name,
        image,
        caption: image.description || undefined
      });
    }
  }

  return pairs;
}

export default async function DatasetTablesPage({ params }: PageProps) {
  const { id } = await params;
  const dataset = await getDatasetById(id);

  if (!dataset) {
    return notFound();
  }

  const datasetIdInt = parseInt(id, 10);
  const allFiles = await getDataFilesByDataset(datasetIdInt);

  const csvFiles = allFiles.filter(f => f.file_type === FILE_TYPES.CSV);
  const tableImages = allFiles.filter(f =>
    f.file_type === FILE_TYPES.IMAGE_PNG &&
    f.file_path.includes('/tables/')
  );

  const tablePairs = pairTablesWithCsvs(csvFiles, tableImages);

  const paperTitle = extractPaperTitle(dataset.fullCitation);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[
        { label: 'Datasets', href: '/datasets' },
        { label: dataset.datasetName, href: `/datasets/${id}` },
        { label: 'Tables' }
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

      <DatasetTabs datasetId={id} activeTab="data-tables" />

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Data Tables</h2>
        <p className="text-sm text-gray-600">
          Table screenshots paired with extracted CSV data files
        </p>

        {tablePairs.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-gray-600">No table data available.</p>
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
                          Table Screenshot
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
                        Download Image
                      </a>
                    </div>
                  )}

                  {/* CSV Data */}
                  {pair.csv && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Extracted CSV Data
                        </h4>
                        <div className="flex gap-3 text-xs text-gray-500">
                          {pair.csv.row_count && (
                            <span>{pair.csv.row_count} rows</span>
                          )}
                          <span>{formatFileSize(pair.csv.file_size_bytes)}</span>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-semibold">File:</span> {pair.csv.file_name}
                        </p>
                        {pair.csv.description && (
                          <p className="text-sm text-gray-600">
                            {pair.csv.description}
                          </p>
                        )}
                      </div>

                      <a
                        href={pair.csv.file_path}
                        download={pair.csv.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                      >
                        Download CSV
                      </a>
                    </div>
                  )}

                  {/* If only image, no CSV */}
                  {pair.image && !pair.csv && (
                    <div className="flex items-center justify-center bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">
                          No CSV data extracted for this table
                        </p>
                        <p className="text-xs text-gray-500">
                          Download the image to view the table
                        </p>
                      </div>
                    </div>
                  )}

                  {/* If only CSV, no image */}
                  {pair.csv && !pair.image && (
                    <div className="flex items-center justify-center bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">
                          No table screenshot available
                        </p>
                        <p className="text-xs text-gray-500">
                          Download the CSV to view the data
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
    </div>
  );
}
