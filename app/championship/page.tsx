export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import TeamTabs from "@/components/TeamTabs";
import CountdownTimerClient from "@/components/CountdownTimerClient";
import ChampionshipStandingsSection from "@/components/ChampionshipStandingsSection";
import ChampionshipPhotoCarousel from "@/components/ChampionshipPhotoCarousel";
import ChampionshipSplash from "@/components/ChampionshipSplash";
import WatchIntroButton from "@/components/WatchIntroButton";
import { getGotSportData, getChampionshipStandings } from "@/lib/data/gotsport";
import { getRedis } from "@/lib/redis";
import { SPLASH_ENABLED_KEY, SPLASH_VIDEO_KEY, type SplashVideo } from "@/app/api/admin/championship/route";
import cache from "@/lib/data/gotsport-cache.json";
import type { TeamSlug } from "@/lib/sanity/queries";

// First U11 kickoff: Nov 14 noon CST = 18:00 UTC
const CHAMPIONSHIP_FIRST_KICKOFF = "2026-11-14T18:00:00Z";
const CHAMPIONSHIP_DATES = new Set(["2026-11-14", "2026-11-15"]);

const PHOTOS = [
  "IMG_3342.jpg",
  "IMG_3337.jpg",
  "IMG_3336.jpg",
  "IMG_3331.jpg",
  "IMG_3330.jpg",
  "IMG_3328.jpg",
  "IMG_3325.jpg",
  "IMG_3323.jpg",
  "IMG_3321.jpg",
  "IMG_3318.jpg",
  "IMG_3315.jpg",
  "IMG_3313.jpg",
  "IMG_3309.jpg",
  "IMG_3305.jpg",
  "IMG_3304.jpg",
  "IMG_3303.jpg",
  "IMG_3302.jpg",
  "IMG_3300.jpg",
  "IMG_3299.jpg",
  "IMG_3298.jpg",
  "IMG_3297.jpg",
  "IMG_3296.jpg",
  "IMG_3295.jpg",
  "IMG_3294.jpg",
];

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

  const northLegends = standings.find((r) => r.isNorthLegends);

  const redis = getRedis();
  const [splashEnabledRaw, splashVideoRaw] = redis
    ? await Promise.all([
        redis.get<string | boolean>(SPLASH_ENABLED_KEY),
        redis.get<SplashVideo>(SPLASH_VIDEO_KEY),
      ])
    : [null, null];
  const splashEnabled = splashEnabledRaw === true || splashEnabledRaw === "true";
  const splashVideo: SplashVideo = splashVideoRaw ?? "goal";

  return (
    <>
      {splashEnabled && (
        <ChampionshipSplash
          wins={northLegends?.w ?? 0}
          losses={northLegends?.l ?? 0}
          draws={northLegends?.t ?? 0}
          rank={northLegends?.rank ?? null}
          team={team}
          splashVideo={splashVideo}
        />
      )}

      {/* HERO */}
      <section className="relative bg-[var(--color-navy)] overflow-hidden">
        {/* U11 video backdrop */}
        {team === "u11" && (
          <video
            src="https://pub-ec6efd6486724c999de33694e15dd4dc.r2.dev/championship-hero-bg.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              team === "u11"
                ? "linear-gradient(to bottom, rgba(10,15,40,0.75) 0%, rgba(10,15,40,0.65) 60%, rgba(10,15,40,0.9) 100%)"
                : "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,175,55,0.2) 0%, transparent 70%)",
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
          <p
            className="font-black uppercase tracking-[0.15em]"
            style={{ color: "#d4af37", fontSize: "clamp(1.25rem, 5vw, 2rem)" }}
          >
            {t("heroRank")}
          </p>
          <p
            className="text-xs uppercase tracking-[0.25em] font-semibold -mt-2"
            style={{ color: "#d4af37", opacity: 0.7 }}
          >
            {t("heroBracket")}
          </p>
          <p className="text-white/60 text-sm md:text-base max-w-xs">
            {t("subheadline")}
          </p>
          {!champOver && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-[var(--color-accent)] text-xs uppercase tracking-widest font-semibold">
                {t("countdownLabel")}
              </p>
              <CountdownTimerClient targetDate={CHAMPIONSHIP_FIRST_KICKOFF} />
              <WatchIntroButton />
            </div>
          )}
        </div>
      </section>

      {/* Single team selector — drives the whole page via URL */}
      <div className="bg-[var(--color-navy)] flex justify-center pb-6 pt-2">
        <TeamTabs activeTeam={team} />
      </div>

      {/* PHOTO / GOAL CLIPS STRIP */}
      <section className="bg-[var(--color-navy)]">
        <div className="max-w-4xl mx-auto px-6 py-10">
          {team === "u11" && PHOTOS.length > 0 ? (
            <ChampionshipPhotoCarousel photos={PHOTOS} heading={t("photosHeading")} />
          ) : team === "u12" ? (
            <>
              <h2 className="text-[var(--color-accent)] font-black uppercase tracking-widest text-sm mb-6">
                {t("photosHeading")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: "N7wVKQVpnLI", label: "vs BYSO Inferno · Oct 25" },
                  { id: "s0RzxId44ec", label: "vs Rattlers Gray · Oct 24 · Goal 5" },
                  { id: "f4IPZ3F3Mok", label: "vs Rattlers Gray · Oct 24 · Goal 9" },
                ].map(({ id, label }) => (
                  <a
                    key={id}
                    href={`https://www.youtube.com/watch?v=${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-2"
                  >
                    <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingBottom: "56.25%" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                        alt={label}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                          <span className="text-white text-lg ml-1">▶</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-white/40 text-xs text-center group-hover:text-white/70 transition-colors">{label}</p>
                  </a>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* Group Stage Standings */}
      {(() => {
        const champStandings = getChampionshipStandings();
        return (
          <ChampionshipStandingsSection
            u11={champStandings.u11}
            u12={champStandings.u12}
            updatedAt={(cache as { updatedAt?: string }).updatedAt ?? null}
            activeTeam={team}
          />
        );
      })()}

      {/* CHAMPIONSHIP CONTENT */}
      <section className="max-w-4xl mx-auto px-4 py-10">
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
    </>
  );
}
