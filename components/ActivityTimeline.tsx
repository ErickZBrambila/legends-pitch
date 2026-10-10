"use client";

import type { VideoAnalytics, VideoClip, VideoMarker } from "@/lib/types";

function fmtSec(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec === 0 ? `${m}m` : `${m}:${String(sec).padStart(2, "0")}`;
}

const W = 560;
const H = 80;

export default function ActivityTimeline({
  analytics,
  clips = [],
  markers = [],
}: {
  analytics: VideoAnalytics;
  clips?: VideoClip[];
  markers?: VideoMarker[];
}) {
  const buckets = analytics.activityBuckets;
  if (!buckets || buckets.length === 0) return null;

  const n = buckets.length;
  const maxDet = Math.max(...buckets.map((b) => b.detections), 1);
  const peakBucket = buckets.reduce((a, b) => (b.detections > a.detections ? b : a), buckets[0]);
  const halftimeIdx = buckets.findIndex((b) => b.tStart >= 1800);
  const barW = W / n;

  const totalSec = buckets[n - 1]?.tEnd ?? 1;
  const goals = clips.filter((c) => c.clipType === "goal");
  // convert time → x position in the SVG
  function timeToX(sec: number) {
    return Math.min(W - 1, (sec / totalSec) * W);
  }
  const total = analytics.goalPressureLeft + analytics.goalPressureRight;
  const leftPct = total > 0 ? Math.round((analytics.goalPressureLeft / total) * 100) : 0;
  const rightPct = total > 0 ? 100 - leftPct : 0;

  // A few evenly-spaced time labels
  const labelStep = Math.ceil(n / 6);
  const labelIdxs = Array.from({ length: n }, (_, i) => i).filter(
    (i) => i === 0 || i === n - 1 || i % labelStep === 0,
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1 h-5 rounded-full bg-purple-500" />
        <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide">Activity Timeline</h2>
        <span className="text-xs text-gray-400 font-medium">
          peak at {fmtSec(peakBucket.tStart)}–{fmtSec(peakBucket.tEnd)}
        </span>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-[9px] text-gray-400 mb-1 uppercase tracking-wide font-semibold">
          Player/ball detections per minute ↑
        </p>
        {/* Bar chart */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ overflow: "visible", display: "block" }}
        >
          {buckets.map((b, i) => {
            const ratio = b.detections / maxDet;
            const barH = Math.max(2, ratio * H);
            const x = i * barW;
            const isPeak = b === peakBucket;
            const isSecond = halftimeIdx !== -1 && i >= halftimeIdx;
            const fill = isPeak
              ? "#c0392b"
              : isSecond
                ? `rgba(234,88,12,${0.35 + ratio * 0.65})`
                : `rgba(99,102,241,${0.35 + ratio * 0.65})`;
            return (
              <rect
                key={i}
                x={x + 0.5}
                y={H - barH}
                width={Math.max(1, barW - 1)}
                height={barH}
                fill={fill}
                rx="1"
              >
                <title>{fmtSec(b.tStart)}–{fmtSec(b.tEnd)}: {b.detections.toLocaleString()} detections</title>
              </rect>
            );
          })}

          {/* Halftime line */}
          {halftimeIdx > 0 && (
            <g>
              <line
                x1={halftimeIdx * barW}
                y1={0}
                x2={halftimeIdx * barW}
                y2={H}
                stroke="rgba(107,114,128,0.6)"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
              <text x={halftimeIdx * barW + 3} y={8} fill="#6b7280" fontSize="8" fontWeight="600">HT</text>
            </g>
          )}

          {/* Key moment markers — full-height amber line + dot at top */}
          {markers.map((m) => {
            const x = timeToX(m.timeSeconds);
            return (
              <g key={m.id}>
                <line x1={x} y1={0} x2={x} y2={H} stroke="rgba(245,158,11,0.5)" strokeWidth="1.5" />
                <circle cx={x} cy={4} r={3.5} fill="#f59e0b" stroke="white" strokeWidth="1">
                  <title>{m.label} — {fmtSec(m.timeSeconds)}</title>
                </circle>
              </g>
            );
          })}

          {/* Goal markers — prominent green line + ⚽ label */}
          {goals.map((c, gi) => {
            const x = timeToX(c.startSeconds);
            return (
              <g key={c.id}>
                <line x1={x} y1={0} x2={x} y2={H} stroke="#16a34a" strokeWidth="2" />
                <rect x={x - 10} y={0} width={20} height={12} rx="2" fill="#16a34a" />
                <text x={x} y={8.5} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="7" fontWeight="bold">
                  ⚽{gi + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="relative mt-1" style={{ height: "16px" }}>
          {labelIdxs.map((i) => {
            const pct = ((i + 0.5) / n) * 100;
            return (
              <span
                key={i}
                className="absolute text-[9px] text-gray-400 -translate-x-1/2"
                style={{ left: `${pct}%` }}
              >
                {fmtSec(buckets[i].tStart)}
              </span>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-2 text-[10px]">
          {halftimeIdx > 0 && (
            <>
              <span className="flex items-center gap-1 text-indigo-600">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-indigo-400" /> 1st Half
              </span>
              <span className="flex items-center gap-1 text-orange-600">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-400" /> 2nd Half
              </span>
            </>
          )}
          <span className="flex items-center gap-1 text-red-700">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-600" /> Peak
          </span>
          {goals.length > 0 && (
            <span className="flex items-center gap-1 text-green-700">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-600" /> Goal
            </span>
          )}
          {markers.length > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" /> Key moment
            </span>
          )}
        </div>
      </div>

      {/* Goal pressure explanation */}
      {total > 0 && (
        <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-black text-gray-600 uppercase tracking-wide mb-1">Goal Pressure</p>
          <p className="text-[10px] text-gray-400 mb-3">
            How often the camera was tracking action near each goal — higher % = more attacking play toward that end.
          </p>

          {/* Per-half breakdown */}
          {analytics.goalPressureLeftH1 !== undefined && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: "1st Half", l: analytics.goalPressureLeftH1 ?? 0, r: analytics.goalPressureRightH1 ?? 0, color: "indigo" },
                { label: "2nd Half", l: analytics.goalPressureLeftH2 ?? 0, r: analytics.goalPressureRightH2 ?? 0, color: "orange" },
              ].map(({ label, l, r, color }) => {
                const t = l + r;
                const lp = t > 0 ? Math.round((l / t) * 100) : 0;
                const rp = t > 0 ? 100 - lp : 0;
                return (
                  <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-lg p-2`}>
                    <p className={`text-[10px] font-bold text-${color}-700 mb-1.5`}>{label}</p>
                    <div className="flex rounded-full overflow-hidden h-5 text-[10px] font-black">
                      <div className="bg-blue-500 text-white flex items-center px-2" style={{ width: `${lp}%` }}>
                        {lp >= 20 && `${lp}%`}
                      </div>
                      <div className="bg-red-500 text-white flex items-center justify-end px-2" style={{ width: `${rp}%` }}>
                        {rp >= 20 && `${rp}%`}
                      </div>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                      <span>◀ Left {lp}%</span>
                      <span>{rp}% Right ▶</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full game bar */}
          <div>
            <p className="text-[10px] text-gray-400 mb-1">Full game</p>
            <div className="flex rounded-full overflow-hidden h-7 text-xs font-black shadow-sm">
              <div className="bg-blue-600 text-white flex items-center px-3 gap-1" style={{ width: `${leftPct}%` }}>
                <span>◀</span>
                {leftPct >= 15 && <span>{leftPct}%</span>}
              </div>
              <div className="bg-red-600 text-white flex items-center justify-end px-3 gap-1" style={{ width: `${rightPct}%` }}>
                {rightPct >= 15 && <span>{rightPct}%</span>}
                <span>▶</span>
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>Left goal</span>
              <span>Right goal</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
