import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getDatasetById,
  getDataFilesByDataset,
  getDatasetTotalFileSize
} from '@/lib/db/queries';
import DownloadSection from '@/components/datasets/DownloadSection';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DatasetTabs from '@/components/datasets/DatasetTabs';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const datasetId = parseInt(id, 10);
  const dataset = await getDatasetById(datasetId);

  if (!dataset) {
    return {
      title: 'Dataset Not Found',
    };
  }

  return {
    title: `Data Files - ${dataset.dataset_name} - AusGeochem`,
    description: `Download data files for ${dataset.dataset_name}`,
  };
}

export default async function DatasetDataPage({ params }: PageProps) {
  const { id } = await params;
  const datasetId = parseInt(id, 10);

  if (isNaN(datasetId)) {
    return notFound();
  }

  const dataset = await getDatasetById(datasetId);

  if (!dataset) {
    return notFound();
  }

  const [files, totalSize] = await Promise.all([
    getDataFilesByDataset(datasetId),
    getDatasetTotalFileSize(datasetId)
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Datasets', href: '/datasets' },
        { label: dataset.dataset_name, href: `/datasets/${datasetId}` },
        { label: 'Data Files' }
      ]} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {dataset.dataset_name}
        </h1>
      </div>

      {/* Tab Navigation */}
      <DatasetTabs datasetId={datasetId} activeTab="data" />

      {/* Download Section */}
      <DownloadSection files={files} datasetId={datasetId} totalSize={totalSize} />
    </div>
  );
}
