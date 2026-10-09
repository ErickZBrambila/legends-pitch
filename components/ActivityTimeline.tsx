"use client";

import type { VideoAnalytics } from "@/lib/types";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec === 0 ? `${m}m` : `${m}:${String(sec).padStart(2, "0")}`;
}

export default function ActivityTimeline({ analytics }: { analytics: VideoAnalytics }) {
  const buckets = analytics.activityBuckets;
  if (!buckets || buckets.length === 0) return null;

  const maxDet = Math.max(...buckets.map((b) => b.detections), 1);
  const peakBucket = buckets.reduce((a, b) => (b.detections > a.detections ? b : a), buckets[0]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1 h-5 rounded-full bg-purple-500" />
        <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide">Activity Timeline</h2>
        <span className="text-xs text-gray-400 font-medium">
          peak at {fmt(peakBucket.tStart)}–{fmt(peakBucket.tEnd)}
        </span>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex items-end gap-1 h-20">
          {buckets.map((b, i) => {
            const ratio = b.detections / maxDet;
            const heightPct = Math.max(6, ratio * 100);
            const isPeak = b === peakBucket;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${heightPct}%`,
                    background: isPeak
                      ? "var(--color-primary, #c0392b)"
                      : `rgba(99, 102, 241, ${0.3 + ratio * 0.7})`,
                  }}
                />
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                  {fmt(b.tStart)}–{fmt(b.tEnd)}: {b.detections.toLocaleString()} detections
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-400">
          {buckets.map((b, i) => (
            <span key={i} className="flex-1 text-center">{fmt(b.tStart)}</span>
          ))}
        </div>
      </div>

      {/* Goal pressure strip */}
      {(analytics.goalPressureLeft > 0 || analytics.goalPressureRight > 0) && (
        <div className="mt-3 flex gap-3">
          <div className="flex-1 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            <span className="text-lg font-black text-blue-700">{analytics.goalPressureLeft.toLocaleString()}</span>
            <div>
              <p className="text-xs font-semibold text-blue-800">Left Goal Pressure</p>
              <p className="text-[10px] text-blue-500">near-goal frames</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <div className="text-right flex-1">
              <p className="text-xs font-semibold text-red-800">Right Goal Pressure</p>
              <p className="text-[10px] text-red-500">near-goal frames</p>
            </div>
            <span className="text-lg font-black text-red-700">{analytics.goalPressureRight.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
