"use client";

import { useEffect, useState } from "react";
import type { StandingRow } from "@/lib/data/gotsport";
import type { Match } from "@/lib/types";

interface TeamPanel {
  slug: "u11" | "u12";
  label: string;
  champStandings: StandingRow[];
  champMatches: Match[];
  locale: string;
}

function fmt(iso: string, locale: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(locale, { month: "short", day: "numeric", timeZone: "America/Chicago" }),
    time: d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }),
  };
}

function MatchRow({ m, locale }: { m: Match; locale: string }) {
  const { date, time } = fmt(m.date, locale);
  const isPostponed = m.postponed;
  const hasResult = m.result !== null;

  return (
    <div
      className="flex items-center justify-between gap-2 py-2.5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tabular-nums" style={{ color: "rgba(255,255,255,0.3)" }}>
          {date} · {time}
        </p>
        <p className="text-xs font-bold leading-tight truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
          vs {m.opponent}
        </p>
      </div>
      <div className="shrink-0">
        {isPostponed ? (
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ background: "rgba(96,165,250,0.15)", color: "#93c5fd", border: "1px solid rgba(96,165,250,0.3)" }}
          >
            🌧 PPD
          </span>
        ) : hasResult ? (
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black tabular-nums text-white">
              {m.goalsFor}–{m.goalsAgainst}
            </span>
            <span
              className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
              style={
                m.result === "W"
                  ? { background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }
                  : m.result === "L"
                  ? { background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" }
                  : { background: "rgba(250,204,21,0.12)", color: "#facc15", border: "1px solid rgba(250,204,21,0.25)" }
              }
            >
              {m.result}
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(212,175,55,0.5)" }}>
            {m.homeAway === "home" ? "Home" : "Away"}
          </span>
        )}
      </div>
    </div>
  );
}

function StandingsRow({ row, maxPts }: { row: StandingRow; maxPts: number }) {
  const isLegends = row.isNorthLegends;
  const pct = maxPts > 0 ? Math.round((row.pts / maxPts) * 100) : 0;
  const gd = row.gf - row.ga;

  return (
    <tr
      style={{
        background: isLegends
          ? "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.04))"
          : "transparent",
        borderLeft: isLegends ? "2px solid rgba(212,175,55,0.5)" : "2px solid transparent",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <td className="py-2 pl-2 pr-1 text-center w-6">
        <span className="text-[11px] font-bold" style={{ color: isLegends ? "#d4af37" : "rgba(255,255,255,0.3)" }}>
          {row.rank === 1 ? "🏆" : row.rank}
        </span>
      </td>
      <td className="py-2 pr-2 max-w-[120px]">
        <div className="flex items-center gap-1">
          {isLegends && (
            <span className="text-[7px] font-black px-1 py-0.5 rounded shrink-0"
              style={{ background: "rgba(212,175,55,0.2)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.3)" }}>
              US
            </span>
          )}
          <span className="text-[11px] font-semibold truncate leading-tight"
            style={{ color: isLegends ? "#f5cc5c" : "rgba(255,255,255,0.8)" }}>
            {row.team.replace(/JYSA North Legends FC - /, "").replace(/JYSA North Legends FC/, "Legends")}
          </span>
        </div>
      </td>
      <td className="py-2 text-center tabular-nums text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{row.gp}</td>
      <td className="py-2 text-center tabular-nums text-[11px] font-semibold" style={{ color: gd > 0 ? "#4ade80" : gd < 0 ? "#f87171" : "rgba(255,255,255,0.4)" }}>
        {gd > 0 ? `+${gd}` : gd}
      </td>
      <td className="py-2 pr-2 text-right w-8">
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-sm font-black tabular-nums" style={{ color: isLegends ? "#f5cc5c" : "rgba(255,255,255,0.9)" }}>
            {row.pts}
          </span>
          <div className="h-1 rounded-full overflow-hidden w-8 hidden sm:block" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full" style={{
              width: `${pct}%`,
              background: isLegends
                ? "linear-gradient(90deg, #b8860b, #d4af37)"
                : "rgba(255,255,255,0.25)",
            }} />
          </div>
        </div>
      </td>
    </tr>
  );
}

function Panel({ slug, label, champStandings, champMatches, locale }: TeamPanel) {
  const maxPts = Math.max(...champStandings.map((r) => r.pts), 1);
  const legendsRow = champStandings.find((r) => r.isNorthLegends);
  const leader = champStandings[0];
  const ptsBehind = leader && legendsRow ? leader.pts - legendsRow.pts : 0;
  const isLeading = legendsRow?.rank === 1;
  const inZone = (legendsRow?.rank ?? 99) <= 2;

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{
        background: "linear-gradient(180deg, #0d0d0f 0%, #111118 100%)",
        borderRight: slug === "u11" ? "1px solid rgba(255,255,255,0.06)" : undefined,
      }}
    >
      {/* Panel header */}
      <div
        className="px-4 pt-5 pb-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(212,175,55,0.15)" }}
      >
        <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-0.5" style={{ color: "#d4af37" }}>
          {slug === "u11" ? "U11 Boys" : "U12 Boys"}
        </p>
        <p className="text-white font-black text-base leading-tight">{label}</p>
        {legendsRow && (
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{
                background: inZone ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.12)",
                color: inZone ? "#4ade80" : "#f87171",
                border: inZone ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(248,113,113,0.25)",
              }}
            >
              {inZone ? "● Champ Zone" : `#${legendsRow.rank}`}
            </span>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              {isLeading ? "Table leaders" : `${ptsBehind} pts behind`}
            </span>
          </div>
        )}
      </div>

      {/* Standings */}
      <div className="px-2 pt-3 pb-1 shrink-0">
        <p className="text-[9px] font-black uppercase tracking-[0.25em] px-2 mb-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
          Group Stage
        </p>
        {champStandings.length > 0 ? (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="pb-1 pl-2 text-left text-[9px] font-semibold uppercase tracking-widest w-6" style={{ color: "rgba(255,255,255,0.2)" }}>#</th>
                <th className="pb-1 text-left text-[9px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>Team</th>
                <th className="pb-1 text-center text-[9px] font-semibold uppercase tracking-widest w-8" style={{ color: "rgba(255,255,255,0.2)" }}>MP</th>
                <th className="pb-1 text-center text-[9px] font-semibold uppercase tracking-widest w-8" style={{ color: "rgba(255,255,255,0.2)" }}>GD</th>
                <th className="pb-1 pr-2 text-right text-[9px] font-semibold uppercase tracking-widest w-16" style={{ color: "rgba(255,255,255,0.2)" }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {champStandings.map((row) => (
                <StandingsRow key={row.team} row={row} maxPts={maxPts} />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs px-2 pb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Standings pending</p>
        )}
      </div>

      {/* Matches */}
      <div className="px-4 pt-3 pb-4 flex-1">
        <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: "rgba(255,255,255,0.2)" }}>
          Matches
        </p>
        {champMatches.length > 0 ? (
          champMatches.map((m) => <MatchRow key={m.id} m={m} locale={locale} />)
        ) : (
          <p className="text-xs py-2" style={{ color: "rgba(255,255,255,0.3)" }}>No games yet</p>
        )}

        {/* Rain-out notice */}
        {champMatches.some((m) => m.postponed) && (
          <div
            className="mt-3 px-3 py-2.5 rounded-xl text-[10px] font-semibold"
            style={{
              background: "rgba(96,165,250,0.08)",
              border: "1px solid rgba(96,165,250,0.2)",
              color: "rgba(147,197,253,0.8)",
            }}
          >
            🌧 Day 2 postponed due to rain. Reschedule TBD.
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  u11: Omit<TeamPanel, "locale">;
  u12: Omit<TeamPanel, "locale">;
  locale: string;
}

function isDuoViewport(): boolean {
  if (typeof window === "undefined") return false;
  // CSS Folding Screen API (Chrome on Android foldables)
  if (window.matchMedia("(horizontal-viewport-segments: 2)").matches) return true;
  // URL override for testing: ?duo=1
  if (new URLSearchParams(window.location.search).get("duo") === "1") return true;
  // Heuristic: iPhone Duo unfolded in landscape is ~1178×390pt — very wide aspect ratio
  const { innerWidth: w, innerHeight: h } = window;
  return w > 700 && h > 0 && w / h > 2.4;
}

export default function ChampionshipDuoLayout({ u11, u12, locale }: Props) {
  const [isDuo, setIsDuo] = useState(false);

  useEffect(() => {
    function check() {
      const active = isDuoViewport();
      setIsDuo(active);
      // Also drive the CSS fold-hide / fold-show for server-rendered siblings
      document.documentElement.classList.toggle("duo-active", active);
    }
    check();
    window.addEventListener("resize", check);
    // Also listen to the CSS segments API if supported
    const mq = window.matchMedia("(horizontal-viewport-segments: 2)");
    mq.addEventListener?.("change", check);
    return () => {
      window.removeEventListener("resize", check);
      mq.removeEventListener?.("change", check);
    };
  }, []);

  if (!isDuo) return null;

  return (
    <div>
      {/* Fold-mode header */}
      <div
        className="px-6 py-3 flex items-center gap-3 shrink-0"
        style={{
          background: "linear-gradient(135deg, rgba(212,175,55,0.08), transparent)",
          borderBottom: "1px solid rgba(212,175,55,0.2)",
        }}
      >
        <span className="text-base">🏆</span>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#d4af37" }}>
            CAYSA Fall Championships 2026
          </p>
          <p className="text-white/40 text-[10px]">Group Stage · Both teams side by side</p>
        </div>
      </div>

      {/* Two-panel grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: "calc(100dvh - 10rem)",
        }}
      >
        <Panel {...u11} locale={locale} />
        <Panel {...u12} locale={locale} />
      </div>
    </div>
  );
}
