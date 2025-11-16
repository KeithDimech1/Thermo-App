/**
 * Dashboard Layout
 *
 * Layout for all dashboard pages with navigation and dataset toggle
 */

import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { DatasetToggle } from '@/components/filters/DatasetToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-4">
        <Suspense fallback={<div className="h-16 bg-blue-50 rounded-lg animate-pulse" />}>
          <DatasetToggle />
        </Suspense>
      </div>
      <main className="container mx-auto px-4 py-4">
        {children}
      </main>
    </div>
  );
}
