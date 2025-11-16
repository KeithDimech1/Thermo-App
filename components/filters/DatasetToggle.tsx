'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

export type DatasetType = 'curated' | 'all';

interface DatasetToggleProps {
  className?: string;
}

export function DatasetToggle({ className }: DatasetToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current dataset from URL (default to 'curated')
  const currentDataset = (searchParams.get('dataset') as DatasetType) || 'curated';

  const handleDatasetChange = (dataset: DatasetType) => {
    // Create new URLSearchParams
    const params = new URLSearchParams(searchParams.toString());

    // Update dataset parameter
    params.set('dataset', dataset);

    // Navigate with new params
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={cn("flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200", className)}>
      <span className="font-medium text-gray-700">Dataset:</span>

      <div className="flex gap-2">
        <button
          onClick={() => handleDatasetChange('curated')}
          className={cn(
            "px-4 py-2 rounded-md font-medium transition-colors",
            currentDataset === 'curated'
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          )}
        >
          Curated Data (132)
        </button>

        <button
          onClick={() => handleDatasetChange('all')}
          className={cn(
            "px-4 py-2 rounded-md font-medium transition-colors",
            currentDataset === 'all'
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          )}
        >
          All Data (261)
        </button>
      </div>

      <div className="ml-2">
        <InfoTooltip />
      </div>
    </div>
  );
}

function InfoTooltip() {
  return (
    <div className="group relative inline-block">
      <button
        type="button"
        className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-700 focus:outline-none"
        aria-label="Dataset information"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="invisible group-hover:visible absolute z-10 w-80 p-4 mt-2 text-sm bg-white border border-gray-200 rounded-lg shadow-lg -right-2">
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-gray-900 mb-2">Dataset Information:</p>
          </div>

          <div>
            <p className="font-medium text-gray-900">Curated Data (132 configs)</p>
            <p className="text-gray-600 mt-1">
              Original validated dataset recommended for clinical decision-making and quality assessment.
            </p>
          </div>

          <div>
            <p className="font-medium text-gray-900">All Data (261 configs)</p>
            <p className="text-gray-600 mt-1">
              Includes curated data plus:
            </p>
            <ul className="list-disc list-inside mt-1 text-gray-600 space-y-1">
              <li><span className="font-medium">NAT (37 configs):</span> Nucleic acid testing data, 100% complete</li>
              <li><span className="font-medium">Serology Extended (92 configs):</span> Extended serology data, 96.7% complete</li>
            </ul>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Use All Data for research, validation, or comprehensive analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
