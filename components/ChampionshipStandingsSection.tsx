"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

export interface StandingRow {
  rank: number;
  team: string;
  gp: number;
  w: number;
  l: number;
  t: number;
  gf: number;
  ga: number;
  pts: number;
  isNorthLegends: boolean;
}

interface Props {
  u11: StandingRow[];
  u12: StandingRow[];
  updatedAt: string | null;
}

const QUALIFY_SPOTS = 2;

function RankMedal({ rank, isLegends }: { rank: number; isLegends: boolean }) {
  if (rank === 1) {
    return (
      <span className="text-base leading-none" title="Group Leaders">
        🏆
      </span>
    );
  }
  if (rank === 2) return <span className="font-black text-[#c0c0c0] text-sm">2</span>;
  if (rank === 3) return <span className="font-black text-[#cd7f32] text-sm">3</span>;
  return (
    <span
      className="font-bold text-sm"
      style={{ color: isLegends ? "#d4af37" : "rgba(255,255,255,0.3)" }}
    >
      {rank}
    </span>
  );
}

function GDCell({ gd }: { gd: number }) {
  const color =
    gd > 0 ? "text-green-400" : gd < 0 ? "text-red-400" : "rgba(255,255,255,0.3)";
  const label = gd > 0 ? `+${gd}` : String(gd);
  return <span className={`font-mono text-xs tabular-nums ${color}`}>{label}</span>;
}

function PointsBar({ pts, maxPts, isLegends }: { pts: number; maxPts: number; isLegends: boolean }) {
  const pct = maxPts > 0 ? Math.round((pts / maxPts) * 100) : 0;
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden"
      style={{ background: "rgba(255,255,255,0.06)", width: 60 }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: isLegends
            ? "linear-gradient(90deg, #b8860b, #d4af37, #f5cc5c)"
            : "linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.35))",
        }}
      />
    </div>
  );
}

function StandingsTable({ rows, t }: { rows: StandingRow[]; t: ReturnType<typeof useTranslations> }) {
  const maxPts = Math.max(...rows.map((r) => r.pts), 1);
  const legendsRow = rows.find((r) => r.isNorthLegends);
  const leader = rows[0];

  return (
    <div>
      {/* Legends status bar */}
      {legendsRow && leader && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl mb-4 text-xs font-semibold"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.05))",
            border: "1px solid rgba(212,175,55,0.25)",
          }}
        >
          <span className="text-[#d4af37]">★ JYSA North Legends FC</span>
          <span className="text-white/30 mx-0.5">·</span>
          {legendsRow.rank === 1 ? (
            <span className="text-[#d4af37]/70">{t("clinched")}</span>
          ) : (
            <span className="text-white/50">
              {t("pointsBehind", { n: leader.pts - legendsRow.pts })}
            </span>
          )}
          <span className="ml-auto">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide"
              style={{
                background: legendsRow.rank <= QUALIFY_SPOTS
                  ? "rgba(74,222,128,0.15)"
                  : "rgba(248,113,113,0.12)",
                color: legendsRow.rank <= QUALIFY_SPOTS ? "#4ade80" : "#f87171",
                border: legendsRow.rank <= QUALIFY_SPOTS
                  ? "1px solid rgba(74,222,128,0.3)"
                  : "1px solid rgba(248,113,113,0.25)",
              }}
            >
              {legendsRow.rank <= QUALIFY_SPOTS ? t("championshipZone") : `#${legendsRow.rank}`}
            </span>
          </span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr>
              <th
                className="text-left pb-2 pl-2 font-semibold text-[10px] uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.25)", width: 32 }}
              >
                {t("colRank")}
              </th>
              <th
                className="text-left pb-2 font-semibold text-[10px] uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                {t("colTeam")}
              </th>
              <th
                className="text-center pb-2 font-semibold text-[10px] uppercase tracking-widest hidden sm:table-cell"
                style={{ color: "rgba(255,255,255,0.25)", width: 32 }}
              >
                {t("colGP")}
              </th>
              <th
                className="text-center pb-2 font-semibold text-[10px] uppercase tracking-widest hidden sm:table-cell"
                style={{ color: "rgba(255,255,255,0.25)", width: 28 }}
              >
                {t("colW")}
              </th>
              <th
                className="text-center pb-2 font-semibold text-[10px] uppercase tracking-widest hidden sm:table-cell"
                style={{ color: "rgba(255,255,255,0.25)", width: 28 }}
              >
                {t("colD")}
              </th>
              <th
                className="text-center pb-2 font-semibold text-[10px] uppercase tracking-widest hidden sm:table-cell"
                style={{ color: "rgba(255,255,255,0.25)", width: 28 }}
              >
                {t("colL")}
              </th>
              <th
                className="text-center pb-2 font-semibold text-[10px] uppercase tracking-widest hidden md:table-cell"
                style={{ color: "rgba(255,255,255,0.25)", width: 40 }}
              >
                {t("colGD")}
              </th>
              <th
                className="text-center pb-2 pr-2 font-semibold text-[10px] uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.25)", width: 36 }}
              >
                {t("colPts")}
              </th>
              <th className="pb-2 hidden sm:table-cell" style={{ width: 72 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isLegends = row.isNorthLegends;
              const gd = row.gf - row.ga;
              const isQualifying = row.rank <= QUALIFY_SPOTS;
              const isLastQualifying = row.rank === QUALIFY_SPOTS;

              return (
                <>
                  <tr
                    key={row.team}
                    style={{
                      background: isLegends
                        ? "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.04))"
                        : idx % 2 === 0
                        ? "rgba(255,255,255,0.02)"
                        : "transparent",
                      borderLeft: isLegends ? "2px solid rgba(212,175,55,0.5)" : "2px solid transparent",
                      borderBottom: isLastQualifying
                        ? "1px dashed rgba(255,255,255,0.1)"
                        : "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    {/* Rank */}
                    <td className="py-2.5 pl-2 pr-1">
                      <div className="flex items-center justify-center w-6">
                        <RankMedal rank={row.rank} isLegends={isLegends} />
                      </div>
                    </td>

                    {/* Team name */}
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-1.5">
                        {isLegends && (
                          <span
                            className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                            style={{
                              background: "rgba(212,175,55,0.2)",
                              color: "#d4af37",
                              border: "1px solid rgba(212,175,55,0.3)",
                            }}
                          >
                            US
                          </span>
                        )}
                        <span
                          className="font-semibold text-[13px] leading-tight"
                          style={{ color: isLegends ? "#f5cc5c" : "rgba(255,255,255,0.85)" }}
                        >
                          {row.team}
                        </span>
                      </div>
                    </td>

                    {/* GP */}
                    <td
                      className="py-2.5 text-center hidden sm:table-cell tabular-nums"
                      style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}
                    >
                      {row.gp}
                    </td>

                    {/* W */}
                    <td
                      className="py-2.5 text-center hidden sm:table-cell tabular-nums font-medium"
                      style={{ color: row.w > 0 ? "#4ade80" : "rgba(255,255,255,0.25)", fontSize: 12 }}
                    >
                      {row.w}
                    </td>

                    {/* D */}
                    <td
                      className="py-2.5 text-center hidden sm:table-cell tabular-nums"
                      style={{ color: row.t > 0 ? "#facc15" : "rgba(255,255,255,0.25)", fontSize: 12 }}
                    >
                      {row.t}
                    </td>

                    {/* L */}
                    <td
                      className="py-2.5 text-center hidden sm:table-cell tabular-nums"
                      style={{ color: row.l > 0 ? "#f87171" : "rgba(255,255,255,0.25)", fontSize: 12 }}
                    >
                      {row.l}
                    </td>

                    {/* GD */}
                    <td className="py-2.5 text-center hidden md:table-cell">
                      <GDCell gd={gd} />
                    </td>

                    {/* Pts */}
                    <td className="py-2.5 pr-2 text-center">
                      <span
                        className="font-black text-base tabular-nums"
                        style={{ color: isLegends ? "#f5cc5c" : "rgba(255,255,255,0.9)" }}
                      >
                        {row.pts}
                      </span>
                    </td>

                    {/* Bar */}
                    <td className="py-2.5 pl-2 pr-1 hidden sm:table-cell">
                      <PointsBar pts={row.pts} maxPts={maxPts} isLegends={isLegends} />
                    </td>
                  </tr>

                  {/* Dashed "elimination line" label */}
                  {isLastQualifying && rows.length > QUALIFY_SPOTS && (
                    <tr key={`zone-${row.team}`}>
                      <td colSpan={9} className="py-0.5">
                        <div className="flex items-center gap-2 px-2 py-0.5">
                          <span
                            className="text-[9px] font-bold uppercase tracking-widest"
                            style={{ color: "rgba(255,255,255,0.2)" }}
                          >
                            ── elimination zone
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-1"
        style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}
      >
        🏆
      </div>
      <p
        className="font-black text-base"
        style={{ color: "#d4af37" }}
      >
        {t("comingSoon")}
      </p>
      <p className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
        {t("comingSoonSub")}
      </p>
    </div>
  );
}

export default function ChampionshipStandingsSection({ u11, u12, updatedAt }: Props) {
  const t = useTranslations("Standings");
  const locale = useLocale();
  const [activeTeam, setActiveTeam] = useState<"u11" | "u12">("u11");

  const standings = activeTeam === "u11" ? u11 : u12;
  const hasData = standings.length > 0;

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        timeZone: "America/Chicago",
      })
    : null;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0d0d0f 0%, #111118 100%)",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(212,175,55,0.15)",
      }}
    >
      {/* Ambient top glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))",
                border: "1px solid rgba(212,175,55,0.35)",
              }}
            >
              🏅
            </div>
            <div>
              <p
                className="text-[9px] font-black uppercase tracking-[0.3em] leading-none mb-0.5"
                style={{ color: "#d4af37" }}
              >
                {t("badge")}
              </p>
              <p className="text-white font-bold text-base leading-tight">{t("heading")}</p>
            </div>
          </div>

          {/* Team toggle */}
          <div
            className="flex items-center p-0.5 rounded-xl shrink-0"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {(["u11", "u12"] as const).map((team) => (
              <button
                key={team}
                onClick={() => setActiveTeam(team)}
                className="relative px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-200"
                style={
                  activeTeam === team
                    ? {
                        background: "linear-gradient(135deg, #b8860b, #d4af37)",
                        color: "#1c1c1e",
                        boxShadow: "0 2px 8px rgba(212,175,55,0.35)",
                      }
                    : {
                        color: "rgba(212,175,55,0.5)",
                        background: "transparent",
                      }
                }
              >
                {team === "u11" ? t("u11Tab") : t("u12Tab")}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {hasData ? (
          <StandingsTable rows={standings} t={t} />
        ) : (
          <EmptyState t={t} />
        )}

        {/* Footer */}
        {formattedDate && hasData && (
          <p
            className="mt-4 text-right text-[10px]"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            {t("lastUpdated", { date: formattedDate })}
          </p>
        )}
      </div>

      {/* Bottom gold thread */}
      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(212,175,55,0.3) 30%, rgba(212,175,55,0.3) 70%, transparent)",
        }}
      />
    </section>
  );
}
