import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Tables',
  description: 'Excel-like interactive data tables with column filters, sorting, and search.',
};

export default function TablesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">📊 Data Tables</h1>
        <p className="text-lg text-slate-600">
          Excel-like interactive data tables with filters, sorting, and search
        </p>
      </div>

      {/* Placeholder content */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Under Construction</h2>
        <p className="text-slate-600 mb-4">
          This page will display interactive data tables with TanStack Table for filtering, sorting, and searching.
        </p>
        <div className="text-sm text-slate-500 space-y-1">
          <p>Tables to include:</p>
          <ul className="list-disc list-inside">
            <li>Geosample Metadata (table-04)</li>
            <li>Fission-Track Counts (table-05)</li>
            <li>Track Lengths (table-06)</li>
            <li>Fission-Track Ages (table-10)</li>
            <li>AHe Grain Data</li>
          </ul>
        </div>
        <p className="text-sm text-slate-500 mt-4">
          Phase 3 implementation in progress
        </p>
      </div>
    </div>
  );
}
