import { Metadata } from 'next';
import { getAllDatasets } from '@/lib/db/earthbank-queries';
import { query } from '@/lib/db/connection';
import DatasetCard from '@/components/datasets/DatasetCard';

export const metadata: Metadata = {
  title: 'Datasets',
  description: 'Browse thermochronology datasets with CSV downloads.',
};

export const dynamic = 'force-dynamic';

// MIGRATED TO EARTHBANK SCHEMA (camelCase)
interface DatasetStats {
  datasetID: string;
  sampleCount: number;
  aftGrainCount: number;
  aheGrainCount: number;
}

async function getDatasetStats(): Promise<Map<string, DatasetStats>> {
  const sql = `
    SELECT
      s."datasetID",
      COUNT(DISTINCT s."sampleID") as sample_count,
      COALESCE(SUM(s."nAFTGrains"), 0) as aft_grain_count,
      COALESCE(SUM(s."nAHeGrains"), 0) as ahe_grain_count
    FROM earthbank_samples s
    GROUP BY s."datasetID"
  `;

  const rows = await query<{
    datasetID: string;
    sample_count: string;
    aft_grain_count: string;
    ahe_grain_count: string;
  }>(sql);

  const statsMap = new Map<string, DatasetStats>();
  rows.forEach(row => {
    statsMap.set(row.datasetID, {
      datasetID: row.datasetID,
      sampleCount: parseInt(row.sample_count, 10),
      aftGrainCount: parseInt(row.aft_grain_count, 10),
      aheGrainCount: parseInt(row.ahe_grain_count, 10)
    });
  });

  return statsMap;
}

export default async function PapersPage() {
  const datasets = await getAllDatasets();
  const statsMap = await getDatasetStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">📄 Datasets</h1>
        <p className="text-lg text-slate-600">
          Browse thermochronology datasets with downloadable data files
        </p>
        <p className="text-sm text-slate-500 mt-2">
          {datasets.length} {datasets.length === 1 ? 'dataset' : 'datasets'} available
        </p>
      </div>

      {/* Datasets Grid */}
      {datasets.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">No Datasets Found</h2>
          <p className="text-slate-600">
            No datasets are currently available in the database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {datasets.map(dataset => {
            const stats = statsMap.get(dataset.id);
            return (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                sampleCount={stats?.sampleCount || 0}
                aftGrainCount={stats?.aftGrainCount || 0}
                aheGrainCount={stats?.aheGrainCount || 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
