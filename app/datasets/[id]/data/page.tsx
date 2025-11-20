import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDatasetById } from '@/lib/db/earthbank-queries';
// NOTE: getDataFilesByDataset uses old queries.ts since data_files table was not migrated to EarthBank schema
import { getDataFilesByDataset } from '@/lib/db/queries';
import DownloadSection from '@/components/datasets/DownloadSection';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DatasetTabs from '@/components/datasets/DatasetTabs';

export const dynamic = 'force-dynamic';

// MIGRATED TO EARTHBANK SCHEMA - IDEA-014 Session 11
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
    title: `Data Files - ${dataset.datasetName} - AusGeochem`,
    description: `Download data files for ${dataset.datasetName}`,
  };
}

export default async function DatasetDataPage({ params }: PageProps) {
  const { id } = await params;

  const dataset = await getDatasetById(id);

  if (!dataset) {
    return notFound();
  }

  // Note: data_files table still uses old schema (dataset_id as integer)
  // Convert string UUID back to integer for this legacy table
  const datasetIdInt = parseInt(id, 10);
  const files = await getDataFilesByDataset(datasetIdInt);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Datasets', href: '/datasets' },
        { label: dataset.datasetName, href: `/datasets/${id}` },
        { label: 'Data Files' }
      ]} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {dataset.datasetName}
        </h1>
      </div>

      {/* Tab Navigation */}
      <DatasetTabs datasetId={id} activeTab="data" />

      {/* Download Section */}
      <DownloadSection files={files} />
    </div>
  );
}
