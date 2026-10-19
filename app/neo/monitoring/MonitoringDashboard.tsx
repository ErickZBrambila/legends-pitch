"use client";

import type { AnalyticsData } from "@/lib/analytics";

const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/schedule": "Schedule",
  "/roster": "Roster",
  "/news": "News",
  "/gallery": "Gallery",
  "/videos": "Videos",
  "/announcements": "Announcements",
  "/contact": "Contact",
  "/roadmap": "Roadmap",
};

function label(path: string) {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith("/news/")) return `Article: ${path.replace("/news/", "")}`;
  if (path.startsWith("/gallery/")) return `Gallery: ${path.replace("/gallery/", "")}`;
  if (path.startsWith("/videos/")) return `Video: ${path.replace("/videos/", "")}`;
  return path;
}

interface Props {
  data: AnalyticsData;
}

const TZ = "America/Chicago";
function localToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export default function MonitoringDashboard({ data }: Props) {
  const { daily, topPages, pushSubscribers, totalPageviews } = data;

  const today = localToday();
  const maxPv = Math.max(...daily.map((d) => d.pageviews), 1);
  const todayStats = daily[daily.length - 1];
  const yesterdayStats = daily[daily.length - 2];

  function trend(today: number, yesterday: number) {
    if (yesterday === 0) return today > 0 ? "↑" : "—";
    const delta = ((today - yesterday) / yesterday) * 100;
    return delta >= 0 ? `↑ ${delta.toFixed(0)}%` : `↓ ${Math.abs(delta).toFixed(0)}%`;
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Today · Pageviews"
          value={String(todayStats?.pageviews ?? 0)}
          sub={trend(todayStats?.pageviews ?? 0, yesterdayStats?.pageviews ?? 0) + " vs yesterday"}
        />
        <StatCard
          label="Today · Unique Visitors"
          value={String(todayStats?.uniques ?? 0)}
          sub={trend(todayStats?.uniques ?? 0, yesterdayStats?.uniques ?? 0) + " vs yesterday"}
        />
        <StatCard
          label="Total Pageviews"
          value={totalPageviews.toLocaleString()}
          sub="all time"
        />
        <StatCard
          label="Push Subscribers"
          value={String(pushSubscribers.total)}
          sub={`iOS ${pushSubscribers.ios} · Android ${pushSubscribers.android}${pushSubscribers.other > 0 ? ` · Other ${pushSubscribers.other}` : ""}`}
          accent
        />
      </div>

      {/* Daily bar chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Daily Pageviews — Last 14 Days</p>
        <div className="flex items-end gap-1 h-32">
          {daily.map((d) => {
            const pct = maxPv > 0 ? (d.pageviews / maxPv) * 100 : 0;
            const isToday = d.date === today;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className={`w-full rounded-t transition-all ${isToday ? "bg-[var(--color-accent)]" : "bg-blue-200 group-hover:bg-blue-400"}`}
                  style={{ height: `${Math.max(pct, 2)}%` }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap flex-col items-center z-10">
                  <span className="font-bold">{d.pageviews} views</span>
                  <span className="text-gray-400">{d.uniques} uniq · {d.date.slice(5)}</span>
                </div>
                <span className="text-[9px] text-gray-300 rotate-45 origin-left hidden sm:block">
                  {d.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-4 text-[11px] text-gray-400">
          <span><span className="inline-block w-2.5 h-2.5 rounded bg-[var(--color-accent)] mr-1" />Today</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded bg-blue-200 mr-1" />Previous days</span>
          <span className="ml-auto">Hover bars for details</span>
        </div>
      </div>

      {/* Daily table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Daily Breakdown</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400">Date</th>
              <th className="text-right px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400">Pageviews</th>
              <th className="text-right px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400">Unique Visitors</th>
            </tr>
          </thead>
          <tbody>
            {[...daily]
              .reverse()
              .slice(0, 10)
              .filter((d) => d.pageviews > 0)
              .map((d, i, arr) => {
                const isToday = d.date === today;
                return (
                  <tr key={d.date} className={`${i < arr.length - 1 ? "border-b border-gray-50" : ""} ${isToday ? "bg-amber-50" : ""}`}>
                    <td className="px-5 py-2.5 font-mono text-xs text-gray-500">
                      {d.date}
                      {isToday && <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">today</span>}
                    </td>
                    <td className="px-5 py-2.5 text-right font-bold text-gray-900">{d.pageviews.toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-right text-gray-500">{d.uniques.toLocaleString()}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Top pages */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Top Pages · All Time</p>
        </div>
        {topPages.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No data yet — check back after some visitors.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {topPages.map((p) => {
              const maxViews = topPages[0]?.views ?? 1;
              const pct = (p.views / maxViews) * 100;
              return (
                <div key={p.path} className="px-5 py-3 flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{label(p.path)}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.path}</p>
                    <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <p className="text-sm font-black text-gray-900 shrink-0">{p.views.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border shadow-sm p-5 ${accent ? "bg-[var(--color-navy)] border-white/10" : "bg-white border-gray-100"}`}>
      <p className={`text-xs font-black uppercase tracking-widest mb-1 ${accent ? "text-white/40" : "text-gray-400"}`}>{label}</p>
      <p className={`text-3xl font-black ${accent ? "text-[var(--color-accent)]" : "text-gray-900"}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? "text-white/30" : "text-gray-400"}`}>{sub}</p>}
    </div>
  );
}
