"use client";

import type { VideoAnalytics } from "@/lib/types";

const ZONE_LABELS = ["Left\nGoal", "", "", "", "Center", "", "", "", "", "Right\nGoal"];

function heatColor(ratio: number): string {
  // cool blue (low) → yellow → red (high)
  if (ratio < 0.33) {
    const t = ratio / 0.33;
    const r = Math.round(59 + t * (234 - 59));
    const g = Math.round(130 + t * (179 - 130));
    const b = Math.round(246 + t * (8 - 246));
    return `rgb(${r},${g},${b})`;
  } else if (ratio < 0.66) {
    const t = (ratio - 0.33) / 0.33;
    const r = Math.round(234 + t * (239 - 234));
    const g = Math.round(179 + t * (68 - 179));
    const b = Math.round(8 + t * (68 - 8));
    return `rgb(${r},${g},${b})`;
  } else {
    const t = (ratio - 0.66) / 0.34;
    const r = Math.round(239 + t * (185 - 239));
    const g = Math.round(68 + t * (28 - 68));
    const b = Math.round(68 + t * (28 - 68));
    return `rgb(${r},${g},${b})`;
  }
}

export default function FieldHeatmap({ analytics }: { analytics: VideoAnalytics }) {
  const zones = analytics.fieldZones;
  if (!zones || zones.length === 0) return null;

  const maxVal = Math.max(...zones, 1);

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1 h-5 rounded-full bg-green-500" />
        <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide">Field Heatmap</h2>
        <span className="text-xs text-gray-400 font-medium">where the action happened</span>
      </div>

      {/* Soccer field SVG with heat zones */}
      <div className="relative rounded-xl overflow-hidden border border-gray-100">
        <svg viewBox="0 0 400 140" className="w-full" style={{ background: "#2d5a1e" }}>
          {/* Field markings */}
          <rect x="0" y="0" width="400" height="140" fill="#2d5a1e" />
          <rect x="10" y="10" width="380" height="120" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          {/* Center line */}
          <line x1="200" y1="10" x2="200" y2="130" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          {/* Center circle */}
          <circle cx="200" cy="70" r="25" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <circle cx="200" cy="70" r="2" fill="rgba(255,255,255,0.6)" />
          {/* Left penalty box */}
          <rect x="10" y="40" width="55" height="60" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <rect x="10" y="55" width="20" height="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          {/* Right penalty box */}
          <rect x="335" y="40" width="55" height="60" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <rect x="370" y="55" width="20" height="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

          {/* Heat zones — 10 vertical strips */}
          {zones.map((count, i) => {
            const ratio = count / maxVal;
            const x = 10 + i * 38;
            const w = 38;
            return (
              <rect
                key={i}
                x={x}
                y={10}
                width={w}
                height={120}
                fill={heatColor(ratio)}
                opacity={0.55}
              />
            );
          })}

          {/* Re-draw field lines on top of heat */}
          <rect x="10" y="10" width="380" height="120" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
          <line x1="200" y1="10" x2="200" y2="130" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
          <circle cx="200" cy="70" r="25" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
          <rect x="10" y="40" width="55" height="60" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
          <rect x="335" y="40" width="55" height="60" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />

          {/* Goal pressure badges */}
          {analytics.goalPressureLeft > 0 && (
            <text x="40" y="75" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" opacity="0.9">
              {analytics.goalPressureLeft}
            </text>
          )}
          {analytics.goalPressureRight > 0 && (
            <text x="360" y="75" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" opacity="0.9">
              {analytics.goalPressureRight}
            </text>
          )}
        </svg>

        {/* Legend */}
        <div className="flex justify-between px-3 py-1.5 bg-gray-800/90 text-xs text-gray-300">
          <span>◀ Left goal</span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-400 opacity-70" /> Low
            <span className="inline-block w-3 h-3 rounded-sm bg-yellow-400 opacity-70" /> Medium
            <span className="inline-block w-3 h-3 rounded-sm bg-red-500 opacity-70" /> High
          </span>
          <span>Right goal ▶</span>
        </div>
      </div>
    </div>
  );
}
