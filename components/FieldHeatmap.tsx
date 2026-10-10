"use client";

import { useState } from "react";
import type { VideoAnalytics } from "@/lib/types";

const FIELD_W = 460;
const FIELD_H = 160;
const M = 12; // margin
const ZONES = 10;
const ZONE_W = (FIELD_W - 2 * M) / ZONES;

function bubbleColor(ratio: number): string {
  if (ratio < 0.5) {
    const t = ratio / 0.5;
    return `rgb(${Math.round(59 + t * 250)},${Math.round(130 + t * 180)},${Math.round(246 + t * (20 - 246))})`;
  }
  const t = (ratio - 0.5) / 0.5;
  return `rgb(${Math.round(250 + t * (220 - 250))},${Math.round(204 + t * (38 - 204))},${Math.round(20 + t * 18)})`;
}

function HeatField({ zones, pressureLeft, pressureRight }: {
  zones: number[];
  pressureLeft: number;
  pressureRight: number;
}) {
  const maxVal = Math.max(...zones, 1);
  const total = pressureLeft + pressureRight;
  const leftPct = total > 0 ? Math.round((pressureLeft / total) * 100) : 0;
  const rightPct = total > 0 ? 100 - leftPct : 0;

  return (
    <div>
      {/* Field with bubbles */}
      <div className="rounded-xl overflow-hidden">
        <svg viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} className="w-full" style={{ background: "#2d5a1e" }}>
          {/* Field lines */}
          <rect x={M} y={M} width={FIELD_W - 2*M} height={FIELD_H - 2*M} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <line x1={FIELD_W/2} y1={M} x2={FIELD_W/2} y2={FIELD_H - M} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <circle cx={FIELD_W/2} cy={FIELD_H/2} r={22} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <circle cx={FIELD_W/2} cy={FIELD_H/2} r={2} fill="rgba(255,255,255,0.55)" />
          <rect x={M} y={FIELD_H/2 - 28} width={52} height={56} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <rect x={M} y={FIELD_H/2 - 13} width={20} height={26} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <rect x={FIELD_W - M - 52} y={FIELD_H/2 - 28} width={52} height={56} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <rect x={FIELD_W - M - 20} y={FIELD_H/2 - 13} width={20} height={26} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

          {/* Activity bubbles — size/color = relative to busiest zone; label = share of total */}
          {zones.map((count, i) => {
            const totalDetections = zones.reduce((s, v) => s + v, 0) || 1;
            const ratio = count / maxVal;          // for size + color
            const sharePct = Math.round((count / totalDetections) * 100); // for label (sums to ~100)
            const cx = M + i * ZONE_W + ZONE_W / 2;
            const cy = FIELD_H / 2;
            const r = 5 + ratio * 28;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill={bubbleColor(ratio)} opacity={0.85} />
                {ratio >= 0.2 && (
                  <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize="7.5" fontWeight="bold" opacity="0.95">
                    {sharePct}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="rgb(59,130,246)" /></svg> Low activity
        </span>
        <span className="flex items-center gap-1">
          <svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="rgb(250,204,20)" /></svg> Medium
        </span>
        <span className="flex items-center gap-1">
          <svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="rgb(220,38,38)" /></svg> High
        </span>
        <span className="text-gray-400">· % = share of total action · size = intensity</span>
      </div>

      {/* Goal pressure bar */}
      {total > 0 && (
        <div className="mt-4">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">
            Goal pressure — where attacks were directed
          </p>
          <div className="flex rounded-full overflow-hidden h-7 text-xs font-black shadow-sm">
            <div
              className="bg-blue-600 text-white flex items-center px-3 gap-1 transition-all"
              style={{ width: `${leftPct}%` }}
            >
              <span>◀</span>
              {leftPct >= 15 && <span>{leftPct}%</span>}
            </div>
            <div
              className="bg-red-600 text-white flex items-center justify-end px-3 gap-1 transition-all"
              style={{ width: `${rightPct}%` }}
            >
              {rightPct >= 15 && <span>{rightPct}%</span>}
              <span>▶</span>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>Left goal</span>
            <span>Right goal</span>
          </div>
        </div>
      )}
    </div>
  );
}

type HalfTab = "full" | "h1" | "h2";

export default function FieldHeatmap({ analytics }: { analytics: VideoAnalytics }) {
  const hasHalves = !!(analytics.fieldZonesFirstHalf?.length && analytics.fieldZonesSecondHalf?.length);
  const [tab, setTab] = useState<HalfTab>("full");

  if (!analytics.fieldZones?.length) return null;

  const tabs: { key: HalfTab; label: string }[] = [
    { key: "full", label: "Full Game" },
    ...(hasHalves ? [
      { key: "h1" as HalfTab, label: "1st Half" },
      { key: "h2" as HalfTab, label: "2nd Half" },
    ] : []),
  ];

  const zones =
    tab === "h1" ? analytics.fieldZonesFirstHalf! :
    tab === "h2" ? analytics.fieldZonesSecondHalf! :
    analytics.fieldZones;

  const pressureLeft =
    tab === "h1" ? (analytics.goalPressureLeftH1 ?? 0) :
    tab === "h2" ? (analytics.goalPressureLeftH2 ?? 0) :
    analytics.goalPressureLeft;

  const pressureRight =
    tab === "h1" ? (analytics.goalPressureRightH1 ?? 0) :
    tab === "h2" ? (analytics.goalPressureRightH2 ?? 0) :
    analytics.goalPressureRight;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1 h-5 rounded-full bg-green-500" />
        <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide">Field Heatmap</h2>
        <span className="text-xs text-gray-400 font-medium">where the action happened</span>
      </div>

      {tabs.length > 1 && (
        <div className="flex gap-1 mb-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                tab === t.key
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <HeatField zones={zones} pressureLeft={pressureLeft} pressureRight={pressureRight} />
    </div>
  );
}
