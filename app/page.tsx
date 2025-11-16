import Link from 'next/link';
import { getDatasetStats } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const stats = await getDatasetStats();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-block mb-6 text-6xl">🏔️</div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Thermochronology Database
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Interactive viewer for fission-track and (U-Th)/He geochronology data from the Malawi Rift
          </p>
          <p className="text-sm text-gray-500 mt-2">
            FAIR-compliant data following Kohn et al. (2024) reporting standards
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="card text-center bg-white shadow-md">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total_samples}</div>
            <div className="text-sm text-gray-600">Geological Samples</div>
          </div>
          <div className="card text-center bg-white shadow-md">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.total_aft_analyses}</div>
            <div className="text-sm text-gray-600">AFT Analyses</div>
          </div>
          <div className="card text-center bg-white shadow-md">
            <div className="text-3xl font-bold text-amber-600 mb-2">{stats.total_ahe_grains}</div>
            <div className="text-sm text-gray-600">(U-Th)/He Grains</div>
          </div>
          <div className="card text-center bg-white shadow-md">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.age_range_ma.aft_min && stats.age_range_ma.aft_max
                ? `${stats.age_range_ma.aft_min.toFixed(1)}-${stats.age_range_ma.aft_max.toFixed(1)}`
                : 'N/A'
              }
            </div>
            <div className="text-sm text-gray-600">AFT Age Range (Ma)</div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="card bg-white shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🔬</div>
            <h3 className="text-xl font-semibold mb-2">Browse Samples</h3>
            <p className="text-gray-600 mb-4">
              Explore {stats.total_samples} geological samples with AFT and (U-Th)/He data
            </p>
            <Link href="/samples" className="text-amber-700 hover:text-amber-900 font-semibold">
              View Samples →
            </Link>
          </div>

          <div className="card bg-white shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📏</div>
            <h3 className="text-xl font-semibold mb-2">Fission-Track Ages</h3>
            <p className="text-gray-600 mb-4">
              View LA-ICP-MS fission-track ages, track lengths, and kinetic parameters
            </p>
            <Link href="/samples" className="text-amber-700 hover:text-amber-900 font-semibold">
              Explore AFT Data →
            </Link>
          </div>

          <div className="card bg-white shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">⚛️</div>
            <h3 className="text-xl font-semibold mb-2">(U-Th)/He Data</h3>
            <p className="text-gray-600 mb-4">
              Analyze {stats.total_ahe_grains} apatite (U-Th)/He single-grain ages
            </p>
            <Link href="/samples" className="text-amber-700 hover:text-amber-900 font-semibold">
              View AHe Data →
            </Link>
          </div>
        </div>

        {/* Dataset Info */}
        <div className="card bg-gradient-to-r from-amber-700 to-amber-900 text-white mb-8">
          <h2 className="text-2xl font-bold mb-4">📍 Malawi Rift - Central Basin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Study Area</h3>
              <p className="text-amber-100">Usisya Border Fault, Malawi Rift Central Basin</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Methods</h3>
              <p className="text-amber-100">LA-ICP-MS Fission-Track + (U-Th)/He Thermochronology</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Age Ranges</h3>
              <p className="text-amber-100">
                AFT: {stats.age_range_ma.aft_min?.toFixed(1)}-{stats.age_range_ma.aft_max?.toFixed(1)} Ma |
                AHe: {stats.age_range_ma.ahe_min?.toFixed(1)}-{stats.age_range_ma.ahe_max?.toFixed(1)} Ma
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Laboratory</h3>
              <p className="text-amber-100">University of Melbourne</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="card bg-white shadow-lg text-center border-2 border-amber-200">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Get Started</h2>
          <p className="text-lg mb-6 text-gray-600">
            Explore thermochronology data to understand the thermal history of the Malawi Rift
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/samples"
              className="btn bg-amber-700 text-white hover:bg-amber-800 font-semibold px-8 py-3 rounded-lg"
            >
              Browse Samples
            </Link>
            <Link
              href="/api/stats"
              className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300 font-semibold px-8 py-3 rounded-lg"
            >
              View Statistics
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-600">
          <p className="text-sm">
            Built with Next.js, TypeScript, and PostgreSQL (Neon)
          </p>
          <p className="text-xs mt-2">
            Data format: FAIR-compliant following Kohn et al. (2024) GSA Bulletin
          </p>
        </footer>
      </div>
    </div>
  );
}
