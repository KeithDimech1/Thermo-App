'use client';

import { useState } from 'react';
import { EarthBankDataset } from '@/lib/types/earthbank-types';
import DatasetCard from './DatasetCard';

interface DatasetStats {
  datasetID: string;
  sampleCount: number;
  aftGrainCount: number;
  aheGrainCount: number;
}

interface DatasetsClientProps {
  datasets: EarthBankDataset[];
  statsMap: Record<string, DatasetStats>;
}

export default function DatasetsClient({ datasets, statsMap }: DatasetsClientProps) {
  const [displayMode, setDisplayMode] = useState<'title' | 'authors'>('title');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">📄 Datasets</h1>
            <p className="text-lg text-slate-600">
              Browse thermochronology datasets with downloadable data files
            </p>
            <p className="text-sm text-slate-500 mt-2">
              {datasets.length} {datasets.length === 1 ? 'dataset' : 'datasets'} available
            </p>
          </div>

          {/* Display Mode Toggle */}
          {datasets.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setDisplayMode('title')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  displayMode === 'title'
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Title
              </button>
              <button
                onClick={() => setDisplayMode('authors')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  displayMode === 'authors'
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Authors
              </button>
            </div>
          )}
        </div>
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
            const stats = statsMap[dataset.id];
            return (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                sampleCount={stats?.sampleCount || 0}
                aftGrainCount={stats?.aftGrainCount || 0}
                aheGrainCount={stats?.aheGrainCount || 0}
                displayMode={displayMode}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
