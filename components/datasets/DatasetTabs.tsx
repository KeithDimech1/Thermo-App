'use client';

import { usePathname, useRouter } from 'next/navigation';

interface Tab {
  id: string;
  label: string;
  href: string;
}

interface DatasetTabsProps {
  datasetId: number;
  activeTab: 'overview' | 'data' | 'fair';
}

export default function DatasetTabs({ datasetId, activeTab }: DatasetTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', href: `/datasets/${datasetId}` },
    { id: 'data', label: 'Data Files', href: `/datasets/${datasetId}/data` },
    { id: 'fair', label: 'FAIR Assessment', href: `/datasets/${datasetId}/fair` },
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
