"use client";

import { useState } from "react";
import type { VideoAnalytics } from "@/lib/types";

function heatColor(ratio: number): string {
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

function HeatField({ zones, pressureLeft, pressureRight }: {
  zones: number[];
  pressureLeft: number;
  pressureRight: number;
}) {
  const maxVal = Math.max(...zones, 1);
  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-100">
      <svg viewBox="0 0 400 140" className="w-full" style={{ background: "#2d5a1e" }}>
        <rect x="0" y="0" width="400" height="140" fill="#2d5a1e" />
        <rect x="10" y="10" width="380" height="120" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="200" y1="10" x2="200" y2="130" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <circle cx="200" cy="70" r="25" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <circle cx="200" cy="70" r="2" fill="rgba(255,255,255,0.6)" />
        <rect x="10" y="40" width="55" height="60" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <rect x="10" y="55" width="20" height="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <rect x="335" y="40" width="55" height="60" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <rect x="370" y="55" width="20" height="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

        {zones.map((count, i) => (
          <rect
            key={i}
            x={10 + i * 38}
            y={10}
            width={38}
            height={120}
            fill={heatColor(count / maxVal)}
            opacity={0.55}
          />
        ))}

        <rect x="10" y="10" width="380" height="120" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        <line x1="200" y1="10" x2="200" y2="130" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        <circle cx="200" cy="70" r="25" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        <rect x="10" y="40" width="55" height="60" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        <rect x="335" y="40" width="55" height="60" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />

        {pressureLeft > 0 && (
          <text x="40" y="75" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" opacity="0.9">
            {pressureLeft.toLocaleString()}
          </text>
        )}
        {pressureRight > 0 && (
          <text x="360" y="75" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" opacity="0.9">
            {pressureRight.toLocaleString()}
          </text>
        )}
      </svg>

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
