export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { STX_POOL_A, STX_POOL_B, STX_SCHEDULE } from "@/lib/data/gotsport";
import cache from "@/lib/data/gotsport-cache.json";
import type { StandingRow } from "@/lib/data/gotsport";

const STX_GOTSPORT_URL =
  "https://system.gotsport.com/org_event/events/59892/results?group=552020";

interface StxCache {
  poolA: StandingRow[];
  poolB: StandingRow[];
}

function getStxStandings(): { poolA: StandingRow[]; poolB: StandingRow[] } {
  const c = cache as unknown as { stx?: StxCache };
  return {
    poolA: c.stx?.poolA ?? [],
    poolB: c.stx?.poolB ?? [],
  };
}

const formatDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  });

const formatTime = (iso: string, locale: string) =>
  new Date(iso).toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("StxBracket");
  return { title: t("metaTitle") };
}

function PoolTable({ label, rows }: { label: string; rows: StandingRow[] }) {
  const allZero = rows.every((r) => r.gp === 0);
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{label}</p>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["#", "Team", "GP", "W", "L", "D", "GF", "GA", "Pts"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide first:pl-4 last:pr-4"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.team} className={row.isNorthLegends ? "bg-amber-50" : ""}>
                <td className="px-3 py-3 pl-4 text-gray-500 tabular-nums">
                  {allZero ? "—" : row.rank}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={
                      row.isNorthLegends
                        ? "text-[var(--color-primary)] font-black"
                        : "text-gray-800"
                    }
                  >
                    {row.isNorthLegends ? "⭐ " : ""}
                    {row.team}
                  </span>
                </td>
                <td className="px-3 py-3 tabular-nums text-gray-600">{row.gp}</td>
                <td className="px-3 py-3 tabular-nums text-green-700 font-semibold">{row.w}</td>
                <td className="px-3 py-3 tabular-nums text-red-600">{row.l}</td>
                <td className="px-3 py-3 tabular-nums text-yellow-700">{row.t}</td>
                <td className="px-3 py-3 tabular-nums text-gray-600">{row.gf}</td>
                <td className="px-3 py-3 tabular-nums text-gray-600">{row.ga}</td>
                <td className="px-3 py-3 pr-4 tabular-nums font-black text-gray-900">{row.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function StxBracketPage() {
  const t = await getTranslations("StxBracket");
  const locale = await getLocale();
  const { poolA, poolB } = getStxStandings();

  return (
    <>
      {/* HERO */}
      <section className="relative bg-[var(--color-navy)] overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,175,55,0.18) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center gap-4">
          <Link
            href="/championship"
            className="text-[var(--color-accent)] text-xs uppercase tracking-widest font-bold hover:opacity-70 transition-opacity"
          >
            {t("backToChamp")}
          </Link>
          <p className="text-[var(--color-accent)] text-xs uppercase tracking-[0.3em] font-bold mt-2">
            {t("eyebrow")}
          </p>
          <h1
            className="campeones-shimmer leading-none"
            style={{
              fontFamily: "var(--font-anton), sans-serif",
              fontSize: "clamp(2.5rem, 14vw, 7rem)",
            }}
          >
            {t("headline")}
          </h1>
          <p className="text-white/80 text-base md:text-lg font-semibold">{t("tournament")}</p>
          <div className="flex flex-wrap gap-3 justify-center mt-1">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{
                background: "rgba(212,175,55,0.12)",
                border: "1px solid rgba(212,175,55,0.3)",
                color: "#d4af37",
              }}
            >
              📍 {t("location")}
            </span>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{
                background: "rgba(212,175,55,0.12)",
                border: "1px solid rgba(212,175,55,0.3)",
                color: "#d4af37",
              }}
            >
              🗓 {t("dates")}
            </span>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{
                background: "rgba(212,175,55,0.12)",
                border: "1px solid rgba(212,175,55,0.3)",
                color: "#d4af37",
              }}
            >
              {t("groupBadge")}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-10">

        {/* POOLS */}
        <section>
          <h2 className="text-xl font-black text-gray-900 mb-5">{t("groupHeading")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Pool A */}
            <div
              className="rounded-2xl overflow-hidden border"
              style={{ borderColor: "rgba(212,175,55,0.35)" }}
            >
              <div
                className="px-4 py-2.5 flex items-center gap-2"
                style={{ background: "rgba(212,175,55,0.08)" }}
              >
                <span className="text-xs font-black uppercase tracking-widest text-[#d4af37]">
                  Pool A
                </span>
                <span className="text-[9px] text-[#d4af37]/60 uppercase tracking-widest font-bold">
                  · Our Pool
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {STX_POOL_A.map((team) => (
                  <div
                    key={team.raw}
                    className="px-4 py-3 flex items-center gap-3"
                    style={{ background: team.isNorthLegends ? "rgba(212,175,55,0.04)" : "white" }}
                  >
                    {team.isNorthLegends && (
                      <Image
                        src="/logo.jpg"
                        alt="North Legends FC"
                        width={28}
                        height={28}
                        className="rounded-full border border-[#d4af37]/50 shrink-0"
                      />
                    )}
                    <p
                      className={`text-sm font-bold truncate ${
                        team.isNorthLegends ? "text-[var(--color-primary)]" : "text-gray-700"
                      }`}
                    >
                      {team.isNorthLegends ? "⭐ " : ""}
                      {team.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pool B */}
            <div className="rounded-2xl overflow-hidden border border-gray-200">
              <div className="px-4 py-2.5 bg-gray-50">
                <span className="text-xs font-black uppercase tracking-widest text-gray-500">
                  Pool B
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {STX_POOL_B.map((team) => (
                  <div key={team.raw} className="px-4 py-3 bg-white">
                    <p className="text-sm font-bold text-gray-700 truncate">{team.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Cross-pool round robin — Pool A plays all 3 teams in Pool B
          </p>
        </section>

        {/* SCHEDULE */}
        <section>
          <h2 className="text-xl font-black text-gray-900 mb-4">{t("scheduleHeading")}</h2>
          <div className="flex flex-col gap-3">
            {STX_SCHEDULE.map((m) => (
              <div
                key={m.id}
                className="bg-[var(--color-navy)] text-white rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ border: "1px solid rgba(212,175,55,0.2)" }}
              >
                <div className="flex-1">
                  <p className="text-[var(--color-accent)] text-xs font-bold uppercase tracking-widest mb-0.5">
                    {formatDate(m.date, locale)} · {formatTime(m.date, locale)}
                  </p>
                  <p className="text-white font-black text-lg leading-tight">
                    {t("vsLabel")} {m.opponent}
                  </p>
                  {m.locationAddress ? (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(m.locationAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-[var(--color-accent)] mt-1 transition-colors"
                    >
                      📍 {m.location} ↗
                    </a>
                  ) : (
                    <p className="text-xs text-white/40 mt-1">📍 {m.location}</p>
                  )}
                </div>
                {m.result ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-2xl font-black text-white tabular-nums">
                      {m.goalsFor}–{m.goalsAgainst}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        m.result === "W"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : m.result === "L"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {m.result}
                    </span>
                  </div>
                ) : (
                  <span
                    className="text-xs font-bold uppercase tracking-widest shrink-0"
                    style={{ color: "#d4af37" }}
                  >
                    {m.homeAway === "home" ? t("homeLabel") : t("awayLabel")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* STANDINGS */}
        <section>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <h2 className="text-xl font-black text-gray-900">{t("standingsHeading")}</h2>
            {poolA.every((r) => r.gp === 0) && (
              <span className="text-xs text-gray-400 font-semibold">Begins Dec 5</span>
            )}
          </div>
          <div className="flex flex-col gap-6">
            {poolA.length > 0 && <PoolTable label="Pool A" rows={poolA} />}
            {poolB.length > 0 && <PoolTable label="Pool B" rows={poolB} />}
          </div>
          <div className="mt-3 flex justify-end">
            <a
              href={STX_GOTSPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-[var(--color-primary)] transition-colors"
            >
              Live standings on GotSport ↗
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
