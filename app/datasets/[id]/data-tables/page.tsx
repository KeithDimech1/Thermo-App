import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDatasetById } from '@/lib/db/earthbank-queries';
import { getDataFilesByDataset } from '@/lib/db/queries';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DatasetTabs from '@/components/datasets/DatasetTabs';
import { extractPaperTitle } from '@/lib/utils/extract-paper-title';
import { FILE_TYPES } from '@/lib/constants/file-types';
import { DataFile } from '@/lib/types/thermo-data';
import DataTablesContent from '@/components/datasets/DataTablesContent';

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

      <DataTablesContent tablePairs={tablePairs} />
    </div>
  );
}
