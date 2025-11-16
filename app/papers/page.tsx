import { Metadata } from 'next';
import { getAllDatasets } from '@/lib/db/queries';
import { query } from '@/lib/db/connection';
import DatasetCard from '@/components/papers/DatasetCard';

export const metadata: Metadata = {
  title: 'Papers & Datasets',
  description: 'Browse thermochronology data organized by research paper and dataset, with CSV downloads.',
};

export const dynamic = 'force-dynamic';

interface DatasetStats {
  dataset_id: number;
  sample_count: number;
  aft_grain_count: number;
  ahe_grain_count: number;
}

async function getDatasetStats(): Promise<Map<number, DatasetStats>> {
  const sql = `
    SELECT
      s.dataset_id,
      COUNT(DISTINCT s.sample_id) as sample_count,
      COALESCE(SUM(s.n_aft_grains), 0) as aft_grain_count,
      COALESCE(SUM(s.n_ahe_grains), 0) as ahe_grain_count
    FROM geosample_metadata s
    GROUP BY s.dataset_id
  `;

  const rows = await query<{
    dataset_id: number;
    sample_count: string;
    aft_grain_count: string;
    ahe_grain_count: string;
  }>(sql);

  const statsMap = new Map<number, DatasetStats>();
  rows.forEach(row => {
    statsMap.set(row.dataset_id, {
      dataset_id: row.dataset_id,
      sample_count: parseInt(row.sample_count, 10),
      aft_grain_count: parseInt(row.aft_grain_count, 10),
      ahe_grain_count: parseInt(row.ahe_grain_count, 10)
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
        <h1 className="text-4xl font-bold text-slate-900 mb-2">📄 Papers & Datasets</h1>
        <p className="text-lg text-slate-600">
          Browse thermochronology data organized by research paper and dataset
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
                sampleCount={stats?.sample_count || 0}
                aftGrainCount={stats?.aft_grain_count || 0}
                aheGrainCount={stats?.ahe_grain_count || 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
