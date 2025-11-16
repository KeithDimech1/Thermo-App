/**
 * Dashboard Page
 *
 * Main dashboard with real-time quality control performance metrics
 */

export const dynamic = 'force-dynamic';

import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { QualityAlerts } from '@/components/dashboard/QualityAlerts';
import { TopPerformers } from '@/components/dashboard/TopPerformers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { getDashboardStats } from '@/lib/db/queries';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { dataset?: string };
}) {
  const dataset = searchParams.dataset || 'curated';
  const stats = await getDashboardStats(dataset as 'curated' | 'all');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Real-time overview of quality control performance across all test configurations
        </p>
      </div>

      {/* Metrics Cards */}
      <MetricsCards
        qualityStats={stats.qualityStats}
        avgCVLt10={stats.avgCVLt10}
      />

      {/* Alerts and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QualityAlerts poorPerformers={stats.poorPerformers} />
        <TopPerformers topPerformers={stats.topPerformers} />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="bordered" className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-4xl">🔬</div>
              <Badge variant="default">28 Markers</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-xl">Markers</CardTitle>
            <CardDescription>
              Browse test markers across TORCH, Hepatitis, HIV, and other infectious diseases
            </CardDescription>
            <Link
              href="/markers"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-4 inline-block"
            >
              View All Markers →
            </Link>
          </CardContent>
        </Card>

        <Card variant="bordered" className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-4xl">🏭</div>
              <Badge variant="default">9 Manufacturers</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-xl">Manufacturers</CardTitle>
            <CardDescription>
              Compare performance across Abbott, Roche, DiaSorin, and other platforms
            </CardDescription>
            <Link
              href="/manufacturers"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-4 inline-block"
            >
              View All Manufacturers →
            </Link>
          </CardContent>
        </Card>

        <Card variant="bordered" className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-4xl">📊</div>
              <Badge variant="default">{stats.qualityStats.total} Configs</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-xl">Assays</CardTitle>
            <CardDescription>
              Review coefficient of variation (CV) metrics and quality ratings
            </CardDescription>
            <Link
              href="/assays"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-4 inline-block"
            >
              View All Assays →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
