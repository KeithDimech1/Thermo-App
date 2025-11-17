import Link from 'next/link';
import { getSampleDetailV1 } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { AHeGrainData } from '@/lib/types/thermo-data';

export const dynamic = 'force-dynamic';

// TODO: Update this page to use getSampleDetail() with datapoint arrays
// Currently using legacy getSampleDetailV1() for backward compatibility

export default async function SampleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const sampleDetail = await getSampleDetailV1(params.id);

  if (!sampleDetail) {
    return notFound();
  }

  const { sample, ft_ages, ft_track_lengths, ft_counts, ahe_grains } = sampleDetail;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/samples" className="text-amber-700 hover:text-amber-900 mb-4 inline-block">
            ← Back to Samples
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{sample.sample_id}</h1>
              <p className="text-gray-600">
                {sample.mineral_type} • {sample.analysis_method}
              </p>
            </div>
            <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-semibold">
              {sample.mineral_type || 'Apatite'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fission-Track Ages */}
            {ft_ages && (
              <div className="card bg-white shadow-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🔬 Fission-Track Ages</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Central Age</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {ft_ages.central_age_ma?.toFixed(1)} ± {ft_ages.central_age_error_ma?.toFixed(1)} Ma
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pooled Age</p>
                    <p className="text-2xl font-bold text-green-600">
                      {ft_ages.pooled_age_ma?.toFixed(1)} ± {ft_ages.pooled_age_error_ma?.toFixed(1)} Ma
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dispersion</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {ft_ages.dispersion_pct?.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">P(χ²)</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {ft_ages.P_chi2 ? (ft_ages.P_chi2 * 100).toFixed(1) : 'N/A'}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Number of Grains</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {ft_ages.n_grains}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Track Lengths */}
            {ft_track_lengths && (
              <div className="card bg-white shadow-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">📏 Track Lengths</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Mean Track Length</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {ft_track_lengths.mean_track_length_um?.toFixed(2)} ± {ft_track_lengths.mean_track_length_sd_um?.toFixed(2)} µm
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confined Tracks</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {ft_track_lengths.n_confined_tracks}
                    </p>
                  </div>
                  {ft_track_lengths.Dpar_um && (
                    <div>
                      <p className="text-sm text-gray-600">Dpar</p>
                      <p className="text-lg font-semibold text-gray-700">
                        {ft_track_lengths.Dpar_um.toFixed(2)} µm
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* (U-Th)/He Grains */}
            {ahe_grains.length > 0 && (
              <div className="card bg-white shadow-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  ⚛️ (U-Th)/He Grain Ages ({ahe_grains.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Lab No</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Corr. Age (Ma)</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">±1σ (Ma)</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">eU (ppm)</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">FT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ahe_grains.map((grain: AHeGrainData, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">{grain.lab_no}</td>
                          <td className="px-4 py-2 text-sm font-semibold text-blue-600">
                            {grain.corr_age_ma?.toFixed(1)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {grain.corr_age_1sigma_ma?.toFixed(1)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {grain.eU_ppm?.toFixed(1)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {grain.FT?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sample Metadata */}
            <div className="card bg-white shadow-md">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sample Information</h3>
              <div className="space-y-3">
                {sample.sampling_location_information && (
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Location</p>
                    <p className="text-sm text-gray-900">{sample.sampling_location_information}</p>
                  </div>
                )}
                {sample.lithology && (
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Lithology</p>
                    <p className="text-sm text-gray-900">{sample.lithology}</p>
                  </div>
                )}
                {sample.sample_kind && (
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Sample Kind</p>
                    <p className="text-sm text-gray-900">{sample.sample_kind}</p>
                  </div>
                )}
                {sample.sample_method && (
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Sample Method</p>
                    <p className="text-sm text-gray-900">{sample.sample_method}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Analytical Info */}
            {ft_counts && (
              <div className="card bg-white shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Analytical Details</h3>
                <div className="space-y-3">
                  {ft_counts.analyst && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Analyst</p>
                      <p className="text-sm text-gray-900">{ft_counts.analyst}</p>
                    </div>
                  )}
                  {ft_counts.laboratory && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Laboratory</p>
                      <p className="text-sm text-gray-900">{ft_counts.laboratory}</p>
                    </div>
                  )}
                  {ft_counts.etching_conditions && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Etching</p>
                      <p className="text-sm text-gray-900">{ft_counts.etching_conditions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Data Summary */}
            <div className="card bg-amber-50 border-2 border-amber-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Data Availability</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">AFT Grains</span>
                  <span className="font-semibold text-gray-900">{sample.n_aft_grains || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">AHe Grains</span>
                  <span className="font-semibold text-gray-900">{sample.n_ahe_grains || 0}</span>
                </div>
                {ft_track_lengths?.n_confined_tracks && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Confined Tracks</span>
                    <span className="font-semibold text-gray-900">{ft_track_lengths.n_confined_tracks}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
