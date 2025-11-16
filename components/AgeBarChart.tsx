'use client';

import { useEffect, useState } from 'react';

interface SampleAgeData {
  sample_id: string;
  central_age_ma: number;
  central_age_error_ma: number;
  n_grains: number;
  elevation_m: number | null;
}

export function AgeBarChart() {
  const [data, setData] = useState<SampleAgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/analysis/ages')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600">Loading age data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading data: {error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-slate-600">No age data available</p>
      </div>
    );
  }

  const maxAge = Math.max(...data.map(d => d.central_age_ma + d.central_age_error_ma));
  const chartHeight = 400;
  const chartWidth = Math.max(800, data.length * 50);
  const barWidth = Math.floor(chartWidth / data.length * 0.7);
  const padding = { top: 20, right: 20, bottom: 60, left: 60 };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Sample Age Distribution ({data.length} samples)
      </h3>

      <div className="overflow-x-auto">
        <svg
          width={chartWidth + padding.left + padding.right}
          height={chartHeight + padding.top + padding.bottom}
          className="border border-slate-100"
        >
          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={chartHeight + padding.top}
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* X-axis */}
          <line
            x1={padding.left}
            y1={chartHeight + padding.top}
            x2={chartWidth + padding.left}
            y2={chartHeight + padding.top}
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* Y-axis label */}
          <text
            x={padding.left - 40}
            y={padding.top + chartHeight / 2}
            transform={`rotate(-90 ${padding.left - 40} ${padding.top + chartHeight / 2})`}
            textAnchor="middle"
            className="text-sm fill-slate-600"
          >
            Age (Ma)
          </text>

          {/* Y-axis ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map(fraction => {
            const y = padding.top + chartHeight * (1 - fraction);
            const value = Math.round(maxAge * fraction);
            return (
              <g key={fraction}>
                <line
                  x1={padding.left - 5}
                  y1={y}
                  x2={padding.left}
                  y2={y}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-slate-600"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Bars and error bars */}
          {data.map((sample, i) => {
            const x = padding.left + (i * chartWidth / data.length) + (chartWidth / data.length - barWidth) / 2;
            const barHeight = (sample.central_age_ma / maxAge) * chartHeight;
            const y = padding.top + chartHeight - barHeight;

            const errorBarHeight = (sample.central_age_error_ma / maxAge) * chartHeight;
            const errorBarY = y - errorBarHeight;
            const errorBarBottomY = y + barHeight + errorBarHeight;

            return (
              <g key={sample.sample_id}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#3b82f6"
                  opacity="0.8"
                  className="hover:opacity-100 cursor-pointer"
                >
                  <title>
                    {sample.sample_id}
{'\n'}Age: {sample.central_age_ma.toFixed(1)} ± {sample.central_age_error_ma.toFixed(1)} Ma
{'\n'}Grains: {sample.n_grains}
                  </title>
                </rect>

                {/* Error bar */}
                <line
                  x1={x + barWidth / 2}
                  y1={errorBarY}
                  x2={x + barWidth / 2}
                  y2={errorBarBottomY}
                  stroke="#1e40af"
                  strokeWidth="2"
                />
                <line
                  x1={x + barWidth / 2 - 5}
                  y1={errorBarY}
                  x2={x + barWidth / 2 + 5}
                  y2={errorBarY}
                  stroke="#1e40af"
                  strokeWidth="2"
                />
                <line
                  x1={x + barWidth / 2 - 5}
                  y1={errorBarBottomY}
                  x2={x + barWidth / 2 + 5}
                  y2={errorBarBottomY}
                  stroke="#1e40af"
                  strokeWidth="2"
                />

                {/* X-axis label */}
                <text
                  x={x + barWidth / 2}
                  y={padding.top + chartHeight + 15}
                  textAnchor="end"
                  transform={`rotate(-45 ${x + barWidth / 2} ${padding.top + chartHeight + 15})`}
                  className="text-xs fill-slate-600"
                >
                  {sample.sample_id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 text-sm text-slate-600">
        <p>Hover over bars to see sample details. Error bars show ±1σ uncertainty.</p>
      </div>
    </div>
  );
}
