import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/images/nrl-logo.png"
              alt="NRL - Science of Quality"
              width={300}
              height={100}
              className="h-20 w-auto"
              priority
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            QC Results Viewer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Interactive web application to visualize and analyze quality control data for infectious disease testing assays
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">132</div>
            <div className="text-sm text-gray-600">Test Configurations</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">48</div>
            <div className="text-sm text-gray-600">Excellent Ratings</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-amber-600 mb-2">29</div>
            <div className="text-sm text-gray-600">Good Ratings</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">28</div>
            <div className="text-sm text-gray-600">Need Review</div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="card">
            <div className="text-4xl mb-4">🔬</div>
            <h3 className="text-xl font-semibold mb-2">Browse Markers</h3>
            <p className="text-gray-600 mb-4">
              Explore test markers across TORCH, Hepatitis, HIV, and other infectious diseases
            </p>
            <Link href="/markers" className="text-[#1a4d7d] hover:text-[#15406b] font-semibold">
              View Markers →
            </Link>
          </div>

          <div className="card">
            <div className="text-4xl mb-4">🏭</div>
            <h3 className="text-xl font-semibold mb-2">Compare Manufacturers</h3>
            <p className="text-gray-600 mb-4">
              Evaluate performance across Abbott, Roche, DiaSorin, and other major platforms
            </p>
            <Link href="/manufacturers" className="text-[#1a4d7d] hover:text-[#15406b] font-semibold">
              View Manufacturers →
            </Link>
          </div>

          <div className="card">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Analyze Performance</h3>
            <p className="text-gray-600 mb-4">
              Review coefficient of variation (CV) metrics and quality ratings
            </p>
            <Link href="/assays" className="text-[#1a4d7d] hover:text-[#15406b] font-semibold">
              View Assays →
            </Link>
          </div>
        </div>

        {/* CTA Section */}
        <div className="card bg-gradient-to-r from-[#1a4d7d] to-[#15406b] text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Get Started</h2>
          <p className="text-lg mb-6 opacity-90">
            Start exploring quality control data to make informed decisions about assay performance
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/dashboard"
              className="btn bg-white text-[#1a4d7d] hover:bg-gray-100 font-semibold"
            >
              View Dashboard
            </Link>
            <Link
              href="/compare"
              className="btn bg-[#d84315] text-white hover:bg-[#bf360c] border-2 border-white font-semibold"
            >
              Compare Assays
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-600">
          <p className="text-sm">
            Built with Next.js, TypeScript, and Tailwind CSS
          </p>
          <p className="text-xs mt-2">
            Data sourced from quality control studies across infectious disease testing platforms
          </p>
        </footer>
      </div>
    </div>
  );
}
