import Link from 'next/link';
import { getSampleDetail } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { FTDatapoint, HeDatapoint, FTCountData, HeWholeGrainData } from '@/lib/types/thermo-data';

export const dynamic = 'force-dynamic';

export default async function SampleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const sampleDetail = await getSampleDetail(resolvedParams.id);

  if (!sampleDetail) {
    return notFound();
  }

  const { sample, ft_datapoints, he_datapoints, ft_count_data, he_whole_grain_data } = sampleDetail;

  // Group count data by datapoint
  const countDataByDatapoint = new Map<number, FTCountData[]>();
  ft_count_data.forEach(count => {
    if (!countDataByDatapoint.has(count.ft_datapoint_id)) {
      countDataByDatapoint.set(count.ft_datapoint_id, []);
    }
    countDataByDatapoint.get(count.ft_datapoint_id)!.push(count);
  });

  // Group grain data by datapoint
  const grainDataByDatapoint = new Map<number, HeWholeGrainData[]>();
  he_whole_grain_data.forEach(grain => {
    if (!grainDataByDatapoint.has(grain.he_datapoint_id)) {
      grainDataByDatapoint.set(grain.he_datapoint_id, []);
    }
    grainDataByDatapoint.get(grain.he_datapoint_id)!.push(grain);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/samples" className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-2">
            ← Back to Samples
          </Link>

          <div className="bg-white rounded-xl shadow-lg p-8 mt-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-5xl font-bold text-gray-900 mb-3">{sample.sample_id}</h1>
                {sample.igsn && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">IGSN:</span> {sample.igsn}
                  </p>
                )}
                <div className="flex gap-3 mt-3">
                  {sample.mineral_type && (
                    <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
                      {sample.mineral_type}
                    </span>
                  )}
                  {sample.lithology && (
                    <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                      {sample.lithology}
                    </span>
                  )}
                </div>
              </div>

              {/* Location Card */}
              {(sample.latitude !== null || sample.longitude !== null) && (
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Location</p>
                  <p className="text-lg font-mono font-semibold text-gray-900">
                    {sample.latitude?.toFixed(4)}°, {sample.longitude?.toFixed(4)}°
                  </p>
                  {sample.elevation_m && (
                    <p className="text-sm text-gray-700 mt-1">
                      Elevation: {sample.elevation_m.toFixed(0)} m
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Data Availability Summary */}
            <div className="mt-6 flex gap-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔬</span>
                <div>
                  <p className="text-xs text-gray-600">FT Analyses</p>
                  <p className="text-2xl font-bold text-blue-600">{ft_datapoints.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚛️</span>
                <div>
                  <p className="text-xs text-gray-600">He Analyses</p>
                  <p className="text-2xl font-bold text-green-600">{he_datapoints.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💎</span>
                <div>
                  <p className="text-xs text-gray-600">Total Grains</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(sample.n_aft_grains || 0) + (sample.n_ahe_grains || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-8">
          {/* Fission-Track Datapoints */}
          {ft_datapoints.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🔬</span> Fission-Track Analyses ({ft_datapoints.length})
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {ft_datapoints.map((datapoint: FTDatapoint, idx: number) => {
                  const counts = countDataByDatapoint.get(datapoint.id) || [];

                  return (
                    <div key={datapoint.id} className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-blue-100">
                      {/* Datapoint Header */}
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm opacity-90 mb-1">Analysis #{idx + 1}</p>
                            <h3 className="text-xl font-bold">{datapoint.datapoint_key}</h3>
                            {datapoint.laboratory && (
                              <p className="text-sm mt-1 opacity-90">{datapoint.laboratory}</p>
                            )}
                          </div>
                          {datapoint.ft_method && (
                            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-semibold">
                              {datapoint.ft_method}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Age Results */}
                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          {datapoint.central_age_ma && (
                            <div className="bg-blue-50 rounded-lg p-4">
                              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Central Age</p>
                              <p className="text-3xl font-bold text-blue-700">
                                {datapoint.central_age_ma.toFixed(1)}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                ± {datapoint.central_age_error_ma?.toFixed(1)} Ma
                              </p>
                            </div>
                          )}

                          {datapoint.pooled_age_ma && (
                            <div className="bg-green-50 rounded-lg p-4">
                              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Pooled Age</p>
                              <p className="text-3xl font-bold text-green-700">
                                {datapoint.pooled_age_ma.toFixed(1)}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                ± {datapoint.pooled_age_error_ma?.toFixed(1)} Ma
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className="text-xs text-gray-600">Grains</p>
                            <p className="text-lg font-bold text-gray-900">{datapoint.n_grains || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Dispersion</p>
                            <p className="text-lg font-bold text-gray-900">
                              {datapoint.dispersion_pct?.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">P(χ²)</p>
                            <p className="text-lg font-bold text-gray-900">
                              {datapoint.P_chi2_pct?.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        {/* Mean Track Length */}
                        {datapoint.mean_track_length_um && (
                          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Mean Track Length</p>
                            <p className="text-lg font-bold text-purple-700">
                              {datapoint.mean_track_length_um.toFixed(2)} ± {datapoint.sd_track_length_um?.toFixed(2)} μm
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {datapoint.n_track_measurements || 0} tracks measured
                            </p>
                          </div>
                        )}

                        {/* Grain Count Data */}
                        {counts.length > 0 && (
                          <details className="mt-4 group">
                            <summary className="cursor-pointer font-semibold text-gray-700 hover:text-blue-600 flex items-center gap-2">
                              <span className="group-open:rotate-90 transition-transform">▶</span>
                              Grain-by-Grain Data ({counts.length} grains)
                            </summary>
                            <div className="mt-3 max-h-96 overflow-auto border border-gray-200 rounded-lg">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 sticky top-0">
                                  <tr>
                                    <th className="px-3 py-2 text-left">Grain ID</th>
                                    <th className="px-3 py-2 text-right">Ns</th>
                                    <th className="px-3 py-2 text-right">Ni</th>
                                    <th className="px-3 py-2 text-right">ρs</th>
                                    <th className="px-3 py-2 text-right">Dpar (μm)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {counts.map(count => (
                                    <tr key={count.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 font-mono text-xs">{count.grain_id}</td>
                                      <td className="px-3 py-2 text-right">{count.ns}</td>
                                      <td className="px-3 py-2 text-right">{count.ni}</td>
                                      <td className="px-3 py-2 text-right">{count.rho_s_cm2?.toFixed(0)}</td>
                                      <td className="px-3 py-2 text-right">{count.dpar_um?.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* (U-Th)/He Datapoints */}
          {he_datapoints.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>⚛️</span> (U-Th)/He Analyses ({he_datapoints.length})
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {he_datapoints.map((datapoint: HeDatapoint, idx: number) => {
                  const grains = grainDataByDatapoint.get(datapoint.id) || [];

                  return (
                    <div key={datapoint.id} className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-green-100">
                      {/* Datapoint Header */}
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm opacity-90 mb-1">Analysis #{idx + 1}</p>
                            <h3 className="text-xl font-bold">{datapoint.datapoint_key}</h3>
                            {datapoint.laboratory && (
                              <p className="text-sm mt-1 opacity-90">{datapoint.laboratory}</p>
                            )}
                          </div>
                          {datapoint.he_analysis_method && (
                            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-semibold">
                              {datapoint.he_analysis_method}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Age Results */}
                      <div className="p-6">
                        {datapoint.mean_he4_corr_age_ma && (
                          <div className="bg-green-50 rounded-lg p-4 mb-6">
                            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Mean Corrected Age</p>
                            <p className="text-4xl font-bold text-green-700">
                              {datapoint.mean_he4_corr_age_ma.toFixed(1)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              ± {datapoint.se_mean_he4_corr_age_ma?.toFixed(1)} Ma (SE)
                            </p>
                          </div>
                        )}

                        {/* Statistics */}
                        <div className="grid grid-cols-3 gap-3 text-center mb-4">
                          <div>
                            <p className="text-xs text-gray-600">Aliquots</p>
                            <p className="text-lg font-bold text-gray-900">{datapoint.n_aliquots || 0}</p>
                          </div>
                          {datapoint.chi_square && (
                            <div>
                              <p className="text-xs text-gray-600">χ²</p>
                              <p className="text-lg font-bold text-gray-900">
                                {datapoint.chi_square.toFixed(2)}
                              </p>
                            </div>
                          )}
                          {datapoint.mswd && (
                            <div>
                              <p className="text-xs text-gray-600">MSWD</p>
                              <p className="text-lg font-bold text-gray-900">
                                {datapoint.mswd.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Grain Data */}
                        {grains.length > 0 && (
                          <details className="mt-4 group" open>
                            <summary className="cursor-pointer font-semibold text-gray-700 hover:text-green-600 flex items-center gap-2">
                              <span className="group-open:rotate-90 transition-transform">▶</span>
                              Single Grain Ages ({grains.length} grains)
                            </summary>
                            <div className="mt-3 max-h-96 overflow-auto border border-gray-200 rounded-lg">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 sticky top-0">
                                  <tr>
                                    <th className="px-3 py-2 text-left">Grain ID</th>
                                    <th className="px-3 py-2 text-right">Corr Age (Ma)</th>
                                    <th className="px-3 py-2 text-right">± Error</th>
                                    <th className="px-3 py-2 text-right">eU (ppm)</th>
                                    <th className="px-3 py-2 text-right">Ft</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {grains.map(grain => (
                                    <tr key={grain.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 font-mono text-xs">{grain.grain_id}</td>
                                      <td className="px-3 py-2 text-right font-semibold text-green-700">
                                        {grain.he4_corr_age_ma?.toFixed(1)}
                                      </td>
                                      <td className="px-3 py-2 text-right text-gray-600">
                                        {grain.he4_corr_age_error_ma?.toFixed(1)}
                                      </td>
                                      <td className="px-3 py-2 text-right">{grain.eu_ppm?.toFixed(0)}</td>
                                      <td className="px-3 py-2 text-right">{grain.ft_value?.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* No Data Message */}
          {ft_datapoints.length === 0 && he_datapoints.length === 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
              <p className="text-2xl mb-2">📭</p>
              <p className="text-lg font-semibold text-gray-700">No analytical data available for this sample</p>
              <p className="text-sm text-gray-600 mt-2">
                This sample exists in the database but has not yet been analyzed or the data has not been imported.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
