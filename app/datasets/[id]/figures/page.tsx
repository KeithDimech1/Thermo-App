import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDatasetById } from '@/lib/db/earthbank-queries';
import { getDataFilesByDataset } from '@/lib/db/queries';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DatasetTabs from '@/components/datasets/DatasetTabs';
import { extractPaperTitle } from '@/lib/utils/extract-paper-title';
import { FILE_TYPES } from '@/lib/constants/file-types';
import FiguresContent from '@/components/datasets/FiguresContent';

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
    (f.file_type === FILE_TYPES.IMAGE_PNG || f.file_type === FILE_TYPES.IMAGE_JPG) &&
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

      <FiguresContent figureFiles={figureFiles} />
    </div>
  );
}
