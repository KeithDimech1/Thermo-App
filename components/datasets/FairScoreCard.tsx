import { FairScoreBreakdown } from '@/lib/types/thermo-data';

interface FairScoreCardProps {
  fairScore: number;
  fairBreakdown?: FairScoreBreakdown | null;
}

export default function FairScoreCard({ fairScore, fairBreakdown }: FairScoreCardProps) {
  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'bg-gray-100 text-gray-800';
    if (grade === 'A') return 'bg-green-100 text-green-800';
    if (grade === 'B') return 'bg-blue-100 text-blue-800';
    if (grade === 'C') return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">FAIR Data Compliance</h2>

      {/* Overall Score */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold text-gray-700">Overall FAIR Score</span>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-green-600">{fairScore}/100</span>
            {fairBreakdown?.grade && (
              <span className={`text-xl font-bold px-3 py-1 rounded ${getGradeColor(fairBreakdown.grade)}`}>
                {fairBreakdown.grade}
              </span>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${getScoreColor(fairScore, 100)}`}
            style={{ width: `${fairScore}%` }}
          />
        </div>
      </div>

      {!fairBreakdown ? (
        <p className="text-gray-600 italic">Detailed breakdown not available</p>
      ) : (
        <>
          {/* FAIR Category Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Findable */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">🔍 Findable</h3>
                <span className="font-bold text-lg">{fairBreakdown.findable_score}/25</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${getScoreColor(fairBreakdown.findable_score || 0, 25)}`}
                  style={{ width: `${((fairBreakdown.findable_score || 0) / 25) * 100}%` }}
                />
              </div>
              {fairBreakdown.findable_reasoning && (
                <p className="text-xs text-gray-600 mt-2">{fairBreakdown.findable_reasoning}</p>
              )}
            </div>

            {/* Accessible */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">🔓 Accessible</h3>
                <span className="font-bold text-lg">{fairBreakdown.accessible_score}/25</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${getScoreColor(fairBreakdown.accessible_score || 0, 25)}`}
                  style={{ width: `${((fairBreakdown.accessible_score || 0) / 25) * 100}%` }}
                />
              </div>
              {fairBreakdown.accessible_reasoning && (
                <p className="text-xs text-gray-600 mt-2">{fairBreakdown.accessible_reasoning}</p>
              )}
            </div>

            {/* Interoperable */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">🔗 Interoperable</h3>
                <span className="font-bold text-lg">{fairBreakdown.interoperable_score}/25</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${getScoreColor(fairBreakdown.interoperable_score || 0, 25)}`}
                  style={{ width: `${((fairBreakdown.interoperable_score || 0) / 25) * 100}%` }}
                />
              </div>
              {fairBreakdown.interoperable_reasoning && (
                <p className="text-xs text-gray-600 mt-2">{fairBreakdown.interoperable_reasoning}</p>
              )}
            </div>

            {/* Reusable */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">♻️ Reusable</h3>
                <span className="font-bold text-lg">{fairBreakdown.reusable_score}/25</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${getScoreColor(fairBreakdown.reusable_score || 0, 25)}`}
                  style={{ width: `${((fairBreakdown.reusable_score || 0) / 25) * 100}%` }}
                />
              </div>
              {fairBreakdown.reusable_reasoning && (
                <p className="text-xs text-gray-600 mt-2">{fairBreakdown.reusable_reasoning}</p>
              )}
            </div>
          </div>

          {/* Kohn et al. (2024) Table Scores */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Kohn et al. (2024) Reporting Standards
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Table 4 */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">Table 4 - Geosample Metadata</span>
                  <span className="font-bold">{fairBreakdown.table4_score}/15</span>
                </div>
                {fairBreakdown.table4_reasoning && (
                  <p className="text-xs text-gray-600 mt-1">{fairBreakdown.table4_reasoning}</p>
                )}
              </div>

              {/* Table 5 */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">Table 5 - FT Counts</span>
                  <span className="font-bold">{fairBreakdown.table5_score}/15</span>
                </div>
                {fairBreakdown.table5_reasoning && (
                  <p className="text-xs text-gray-600 mt-1">{fairBreakdown.table5_reasoning}</p>
                )}
              </div>

              {/* Table 6 */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">Table 6 - Track Lengths</span>
                  <span className="font-bold">{fairBreakdown.table6_score}/10</span>
                </div>
                {fairBreakdown.table6_reasoning && (
                  <p className="text-xs text-gray-600 mt-1">{fairBreakdown.table6_reasoning}</p>
                )}
              </div>

              {/* Table 10 */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">Table 10 - Ages</span>
                  <span className="font-bold">{fairBreakdown.table10_score}/10</span>
                </div>
                {fairBreakdown.table10_reasoning && (
                  <p className="text-xs text-gray-600 mt-1">{fairBreakdown.table10_reasoning}</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reference */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <span className="font-semibold">FAIR Assessment Framework:</span> Based on{' '}
          <a href="https://doi.org/10.1130/B36557.1" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
            Kohn et al. (2024) GSA Bulletin
          </a>
          {' '}and{' '}
          <a href="https://doi.org/10.1016/j.chemgeo.2025.123092" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
            Nixon et al. (2025) Chemical Geology
          </a>
        </p>
      </div>
    </div>
  );
}
