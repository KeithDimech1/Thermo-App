'use client';

import { useRouter } from 'next/navigation';

interface Tab {
  id: string;
  label: string;
  href: string;
}

// MIGRATED TO EARTHBANK SCHEMA - IDEA-014
interface DatasetTabsProps {
  datasetId: string;  // Changed from number to string for URL param compatibility
  activeTab: 'overview' | 'data' | 'fair' | 'tables' | 'analysis' | 'pdfs' | 'figures' | 'data-tables';
}

export default function DatasetTabs({ datasetId, activeTab }: DatasetTabsProps) {
  const router = useRouter();

  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', href: `/datasets/${datasetId}` },
    { id: 'pdfs', label: 'PDFs', href: `/datasets/${datasetId}/pdfs` },
    { id: 'figures', label: 'Figures', href: `/datasets/${datasetId}/figures` },
    { id: 'data-tables', label: 'Tables', href: `/datasets/${datasetId}/data-tables` },
    { id: 'fair', label: 'ThermoFAIR', href: `/datasets/${datasetId}/fair` },
    { id: 'tables', label: 'Database Tables', href: `/datasets/${datasetId}/tables` },
    { id: 'analysis', label: 'Analysis', href: `/datasets/${datasetId}/analysis` },
  ];

  return (
    <div className="border-b border-gray-200 mb-8">
      <nav className="flex -mb-px space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  isActive
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
