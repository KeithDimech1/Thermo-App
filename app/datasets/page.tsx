import { getAllDatasets } from '@/lib/db/earthbank-queries';
import { query } from '@/lib/db/connection';
import DatasetsClient from '@/components/datasets/DatasetsClient';
import { Metadata } from 'next';

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

  // Convert Map to plain object for client component
  const statsObject: Record<string, DatasetStats> = {};
  statsMap.forEach((value, key) => {
    statsObject[key] = value;
  });

  return <DatasetsClient datasets={datasets} statsMap={statsObject} />;
}
