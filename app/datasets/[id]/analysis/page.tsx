import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDatasetById } from '@/lib/db/queries';
import { AgeBarChart } from '@/components/AgeBarChart';
import DatasetTabs from '@/components/datasets/DatasetTabs';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const datasetId = parseInt(id, 10);
  const dataset = await getDatasetById(datasetId);

  if (!dataset) {
    return {
      title: 'Dataset Not Found',
    };
  }

  return {
    title: `Analysis - ${dataset.dataset_name}`,
    description: `Interactive visualizations and analysis tools for ${dataset.dataset_name}`,
  };
}

export default async function DatasetAnalysisPage({ params }: Props) {
  const { id } = await params;
  const datasetId = parseInt(id, 10);

  if (isNaN(datasetId)) {
    return notFound();
  }

  const dataset = await getDatasetById(datasetId);

  if (!dataset) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Datasets', href: '/datasets' },
        { label: dataset.dataset_name, href: `/datasets/${datasetId}` },
        { label: 'Analysis' }
      ]} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Analysis & Visualization
        </h1>
        <p className="text-lg text-slate-600">
          {dataset.dataset_name}
        </p>
      </div>

      {/* Dataset Tabs */}
      <DatasetTabs datasetId={datasetId} activeTab="analysis" />

      {/* Interactive Visualization */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Sample Age Distribution</h2>
        <AgeBarChart datasetId={datasetId} />
      </div>

      {/* Overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">Python Analysis Tools (IDEA-009)</h2>
        <p className="text-slate-700 mb-4">
          We have implemented comprehensive Python CLI tools for thermochronology data analysis.
          These tools query the PostgreSQL database and generate publication-quality visualizations
          using Plotly and Matplotlib.
        </p>
        <div className="flex gap-4">
          <div className="bg-white rounded-md px-4 py-2 border border-blue-300">
            <div className="text-2xl font-bold text-blue-600">7</div>
            <div className="text-sm text-slate-600">Plot Types</div>
          </div>
          <div className="bg-white rounded-md px-4 py-2 border border-blue-300">
            <div className="text-2xl font-bold text-blue-600">14</div>
            <div className="text-sm text-slate-600">Database Queries</div>
          </div>
          <div className="bg-white rounded-md px-4 py-2 border border-blue-300">
            <div className="text-2xl font-bold text-blue-600">4</div>
            <div className="text-sm text-slate-600">Output Formats</div>
          </div>
        </div>
      </div>

      {/* Phase 1: Statistical Visualizations */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Phase 1: Statistical Visualizations</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Radial Plots */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Radial Plots (Galbraith)</h3>
            <p className="text-sm text-slate-600 mb-3">
              Single-grain age distributions with standardized estimates. Visualize age dispersion
              and identify outliers.
            </p>
            <div className="bg-slate-50 rounded-md p-3 font-mono text-xs overflow-x-auto">
              <code className="text-slate-800">
                python scripts/analysis/statistical_plots.py \<br/>
                &nbsp;&nbsp;--sample-id 1 --plot radial \<br/>
                &nbsp;&nbsp;--output radial.pdf
              </code>
            </div>
          </div>

          {/* Age Histograms */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Age Histograms + KDE</h3>
            <p className="text-sm text-slate-600 mb-3">
              Age distributions with kernel density estimate overlays. Compare datasets and
              identify age populations.
            </p>
            <div className="bg-slate-50 rounded-md p-3 font-mono text-xs overflow-x-auto">
              <code className="text-slate-800">
                python scripts/analysis/statistical_plots.py \<br/>
                &nbsp;&nbsp;--dataset-id {datasetId} --plot histogram \<br/>
                &nbsp;&nbsp;--kde --output hist.pdf
              </code>
            </div>
          </div>

          {/* Probability Density */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Probability Density Plots</h3>
            <p className="text-sm text-slate-600 mb-3">
              Summed Gaussian PDFs for detrital thermochronology analysis. Ideal for
              multi-grain age populations.
            </p>
            <div className="bg-slate-50 rounded-md p-3 font-mono text-xs overflow-x-auto">
              <code className="text-slate-800">
                python scripts/analysis/statistical_plots.py \<br/>
                &nbsp;&nbsp;--sample-id 1 --plot pdf \<br/>
                &nbsp;&nbsp;--output pdf.pdf
              </code>
            </div>
          </div>

          {/* QA Plots */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">P(χ²) vs Dispersion QA</h3>
            <p className="text-sm text-slate-600 mb-3">
              Quality assessment scatter plots for dataset-wide QA. Identify samples with
              high dispersion or poor statistics.
            </p>
            <div className="bg-slate-50 rounded-md p-3 font-mono text-xs overflow-x-auto">
              <code className="text-slate-800">
                python scripts/analysis/statistical_plots.py \<br/>
                &nbsp;&nbsp;--dataset-id {datasetId} --plot qa \<br/>
                &nbsp;&nbsp;--output qa.png
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 2: Spatial Analysis */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Phase 2: Spatial Analysis</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Age-Elevation */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Age-Elevation Plots</h3>
            <p className="text-sm text-slate-600 mb-3">
              Calculate exhumation rates from age-elevation relationships. Automatic linear
              regression with 95% confidence intervals.
            </p>
            <div className="bg-slate-50 rounded-md p-3 font-mono text-xs overflow-x-auto">
              <code className="text-slate-800">
                python scripts/analysis/spatial_plots.py \<br/>
                &nbsp;&nbsp;--dataset-id {datasetId} --plot age-elevation \<br/>
                &nbsp;&nbsp;--method AFT --closure-temp 110 \<br/>
                &nbsp;&nbsp;--geothermal-gradient 25 --output aer.pdf
              </code>
            </div>
          </div>

          {/* Spatial Transects */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Spatial Transect Plots</h3>
            <p className="text-sm text-slate-600 mb-3">
              Age vs latitude/longitude with multi-method overlay (AFT + AHe). Visualize
              spatial age trends and thermal history.
            </p>
            <div className="bg-slate-50 rounded-md p-3 font-mono text-xs overflow-x-auto">
              <code className="text-slate-800">
                python scripts/analysis/spatial_plots.py \<br/>
                &nbsp;&nbsp;--dataset-id {datasetId} --plot transect \<br/>
                &nbsp;&nbsp;--methods AFT,AHe --axis latitude \<br/>
                &nbsp;&nbsp;--output transect.pdf
              </code>
            </div>
          </div>

          {/* MTL Trends */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">MTL Spatial Trends</h3>
            <p className="text-sm text-slate-600 mb-3">
              Mean track length analysis with spatial context. Identify cooling rate variations
              and thermal history patterns.
            </p>
            <div className="bg-slate-50 rounded-md p-3 font-mono text-xs overflow-x-auto">
              <code className="text-slate-800">
                python scripts/analysis/spatial_plots.py \<br/>
                &nbsp;&nbsp;--dataset-id {datasetId} --plot mtl-trends \<br/>
                &nbsp;&nbsp;--axis latitude --output mtl.pdf
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Output Formats */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">Output Formats</h2>
        <p className="text-slate-700 mb-3">All plots support multiple output formats:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-md px-3 py-2 border border-green-300">
            <div className="font-semibold text-green-700">.pdf</div>
            <div className="text-xs text-slate-600">Publication (300 DPI)</div>
          </div>
          <div className="bg-white rounded-md px-3 py-2 border border-green-300">
            <div className="font-semibold text-green-700">.png</div>
            <div className="text-xs text-slate-600">Web/Presentation</div>
          </div>
          <div className="bg-white rounded-md px-3 py-2 border border-green-300">
            <div className="font-semibold text-green-700">.html</div>
            <div className="text-xs text-slate-600">Interactive Plotly</div>
          </div>
          <div className="bg-white rounded-md px-3 py-2 border border-green-300">
            <div className="font-semibold text-green-700">.svg</div>
            <div className="text-xs text-slate-600">Vector Graphics</div>
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">Documentation & Setup</h2>
        <p className="text-slate-700 mb-4">
          Complete documentation is available in the <code className="bg-slate-200 px-2 py-1 rounded text-sm">scripts/analysis/README.md</code> file.
        </p>

        <div className="mb-4">
          <h3 className="font-semibold text-slate-900 mb-2">Installation</h3>
          <div className="bg-white rounded-md p-3 font-mono text-xs overflow-x-auto border border-slate-300">
            <code className="text-slate-800">
              source .venv/bin/activate<br/>
              pip install plotly matplotlib scipy pandas numpy psycopg2-binary python-dotenv
            </code>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900 mb-2">Configuration</h3>
          <p className="text-sm text-slate-600 mb-2">
            Tools automatically load database credentials from <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">.env.local</code>
          </p>
          <div className="bg-white rounded-md p-3 font-mono text-xs overflow-x-auto border border-slate-300">
            <code className="text-slate-800">
              # .env.local<br/>
              DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
            </code>
          </div>
        </div>
      </div>

      {/* References */}
      <div className="mt-8 text-sm text-slate-500">
        <p>
          <strong>Implementation:</strong> IDEA-009 Phase 1 & 2 (Statistical & Spatial Analysis) —
          Completed 2025-11-16
        </p>
        <p>
          <strong>References:</strong> Galbraith (1988, 1990), Kohn et al. (2024)
        </p>
      </div>
    </div>
  );
}
