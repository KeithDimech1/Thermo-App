import DatasetTabs from '@/components/datasets/DatasetTabs';
import Breadcrumb from '@/components/ui/Breadcrumb';
import TablesView from '@/components/datasets/TablesView';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function DatasetTablesPage({ params }: Props) {
  const { id: datasetId } = await params;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Datasets', href: '/datasets' },
        { label: `Dataset ${datasetId}`, href: `/datasets/${datasetId}` },
        { label: 'Tables' }
      ]} />

      {/* Dataset Tabs */}
      <DatasetTabs datasetId={datasetId} activeTab="tables" />

      {/* Tables View - Client Component */}
      <TablesView datasetId={datasetId} />
    </div>
  );
}
