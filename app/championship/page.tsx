import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import TeamTabs from "@/components/TeamTabs";
import CountdownTimerClient from "@/components/CountdownTimerClient";
import { getGotSportData } from "@/lib/data/gotsport";
import type { TeamSlug } from "@/lib/sanity/queries";

// First U11 kickoff: Nov 14 noon CST = 18:00 UTC
const CHAMPIONSHIP_FIRST_KICKOFF = "2026-11-14T18:00:00Z";
const CHAMPIONSHIP_DATES = new Set(["2026-11-14", "2026-11-15"]);

// Drop championship photos in /public/championship/ and push filenames here
const PHOTOS: string[] = [];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Championship");
  return { title: t("metaTitle") };
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

export default async function ChampionshipPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const team: TeamSlug = teamParam === "u12" ? "u12" : "u11";

  const t = await getTranslations("Championship");
  const locale = await getLocale();

  const { matches, standings } = await getGotSportData(team);

  const champMatches = matches.filter((m) =>
    CHAMPIONSHIP_DATES.has(m.date.slice(0, 10))
  );

  const champOver = Date.now() > new Date("2026-11-16T00:00:00Z").getTime();

  return (
    <>
      {/* HERO */}
      <section className="relative bg-[var(--color-navy)] overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,175,55,0.2) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center gap-4">
          <p className="text-[var(--color-accent)] text-xs uppercase tracking-[0.3em] font-bold">
            {t("eyebrow")}
          </p>
          <h1
            className="campeones-shimmer leading-none"
            style={{
              fontFamily: "var(--font-anton), sans-serif",
              fontSize: "clamp(4rem, 20vw, 10rem)",
            }}
          >
            {t("headline")}
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-xs">
            {t("subheadline")}
          </p>
          {!champOver && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-[var(--color-accent)] text-xs uppercase tracking-widest font-semibold">
                {t("countdownLabel")}
              </p>
              <CountdownTimerClient targetDate={CHAMPIONSHIP_FIRST_KICKOFF} />
            </div>
          )}
        </div>
      </section>

      {/* CHAMPIONSHIP CONTENT */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex justify-center mb-8">
          <TeamTabs activeTeam={team} />
        </div>

        {/* Schedule */}
        <h2 className="text-xl font-black text-gray-900 mb-5">{t("gamesHeading")}</h2>
        <div className="flex flex-col gap-3 mb-10">
          {champMatches.length === 0 ? (
            <p className="text-gray-400 text-sm">—</p>
          ) : (
            champMatches.map((m) => (
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
                  <span className="text-[var(--color-accent)] text-xs font-bold uppercase tracking-widest shrink-0">
                    {m.homeAway === "home" ? t("homeLabel") : t("awayLabel")}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Standings */}
        <h2 className="text-xl font-black text-gray-900 mb-5">{t("standingsHeading")}</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["#", t("colTeam"), "GP", "W", "L", "Pts"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide first:pl-4 last:pr-4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {standings.map((row) => (
                <tr key={row.team} className={row.isNorthLegends ? "bg-amber-50" : ""}>
                  <td className="px-3 py-3 pl-4 text-gray-500 tabular-nums">{row.rank}</td>
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
                  <td className="px-3 py-3 pr-4 tabular-nums font-black text-gray-900">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PHOTO STRIP */}
      {/* Add photos: drop files in /public/championship/ and push filenames into the PHOTOS array above */}
      <section className="bg-[var(--color-navy)] mt-4">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <h2 className="text-xl font-black text-white mb-6">{t("photosHeading")}</h2>
          <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide">
            {PHOTOS.length > 0
              ? PHOTOS.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={`/championship/${src}`}
                    alt={`Championship photo ${i + 1}`}
                    className="shrink-0 w-56 h-40 object-cover rounded-xl snap-start"
                  />
                ))
              : Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="shrink-0 w-56 h-40 rounded-xl snap-start flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <span className="text-3xl opacity-20">📷</span>
                  </div>
                ))}
          </div>
          <p className="text-white/25 text-xs mt-3">{t("photosHint")}</p>
        </div>
      </section>
    </>
  );
}
