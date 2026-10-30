import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import HeroCarousel from "@/components/HeroCarousel";
import CountdownTimerClient from "@/components/CountdownTimerClient";
import TeamTabs from "@/components/TeamTabs";
import ScrollDepthTracker from "@/components/ScrollDepthTracker";
import TrackedLink from "@/components/TrackedLink";
import TrackedAnchor from "@/components/TrackedAnchor";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { getPostsByTeam, getLatestAnnouncement, getLatestSessionWithReel } from "@/lib/sanity/queries";
import type { TeamSlug } from "@/lib/sanity/queries";
import { getGotSportData, LOCATION_COORDS } from "@/lib/data/gotsport";
import GameWeather from "@/components/GameWeather";
import ChampionshipSplash from "@/components/ChampionshipSplash";
import ChampionshipSection from "@/components/ChampionshipSection";

const withinForecastWindow = (iso: string) => {
  const diff = (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= -0.5 && diff <= 7;
};

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

const resultColors: Record<string, string> = {
  W: "bg-green-100 text-green-800 border border-green-200",
  L: "bg-red-100 text-red-800 border border-red-200",
  D: "bg-yellow-100 text-yellow-800 border border-yellow-200",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const team: TeamSlug = teamParam === "u12" ? "u12" : "u11";
  const teamExplicitlySelected = teamParam === "u11" || teamParam === "u12";

  const t = await getTranslations("Home");
  const ts = await getTranslations("Sponsors");
  const locale = await getLocale();

  const [latestNews, latestAnnouncement, latestReelSession] = await Promise.all([
    getPostsByTeam(team),
    getLatestAnnouncement(team),
    getLatestSessionWithReel(team),
  ]);

  const { standings, matches } = await getGotSportData(team);
  const legendsRank = standings.find((s) => s.isNorthLegends)?.rank ?? null;
  const now = new Date();
  const played = matches.filter((m) => m.result !== null);
  const stats = {
    wins: played.filter((m) => m.result === "W").length,
    losses: played.filter((m) => m.result === "L").length,
    draws: played.filter((m) => m.result === "D").length,
    goalsFor: played.reduce((s, m) => s + (m.goalsFor ?? 0), 0),
    goalsAgainst: played.reduce((s, m) => s + (m.goalsAgainst ?? 0), 0),
  };
  const nextMatch =
    matches
      .filter((m) => m.result === null && new Date(m.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null;
  const recentResults = played
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const topNews = latestNews.slice(0, 2);

  return (
    <>
      <ScrollDepthTracker page="home" />
      {teamExplicitlySelected && (
        <ChampionshipSplash
          wins={stats.wins}
          losses={stats.losses}
          draws={stats.draws}
          rank={legendsRank}
          team={team}
        />
      )}
      {/* Hero */}
      <section className="relative bg-[var(--color-navy)] overflow-hidden">
        <HeroCarousel />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center gap-4">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shadow-2xl border-4 border-[var(--color-accent)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="North Legends FC" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
            North Legends FC
          </h1>
          <p className="text-[var(--color-accent-light)] text-base md:text-lg max-w-md italic font-medium">
            {t("tagline")}
          </p>
          <div className="flex gap-3 mt-2">
            <TrackedLink
              href={`/schedule?team=${team}`}
              eventName="hero_cta_click"
              eventProps={{ button: "view_schedule", team }}
              className="px-5 py-2.5 bg-[var(--color-accent)] text-[#1c1c1e] font-bold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors shadow-md"
            >
              {t("viewSchedule")}
            </TrackedLink>
            <TrackedLink
              href={`/roster?team=${team}`}
              eventName="hero_cta_click"
              eventProps={{ button: "meet_the_team", team }}
              className="px-5 py-2.5 bg-[var(--color-accent)] text-[#1c1c1e] font-bold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors shadow-md"
            >
              {t("meetTheTeam")}
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* Latest Match Reel teaser */}
      {latestReelSession && (
        <Link
          href={`/videos/${latestReelSession.id}?team=${team}`}
          className="block bg-[var(--color-navy)] border-b border-white/10 hover:bg-[#1a2235] transition-colors"
        >
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40">
              <svg className="w-4 h-4 text-[var(--color-accent)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <p className="text-white text-sm font-semibold flex-1 leading-snug">
              🎬 Fresh from the pitch!{" "}
              <span className="text-[var(--color-accent)]">
                {latestReelSession.compilationTitle}
              </span>
            </p>
            <span className="shrink-0 text-[var(--color-accent)] text-xs font-bold tracking-wide">
              Watch →
            </span>
          </div>
        </Link>
      )}

      {/* Fall Championship section */}
      <ChampionshipSection
        wins={stats.wins}
        losses={stats.losses}
        draws={stats.draws}
        goalsFor={stats.goalsFor}
        goalsAgainst={stats.goalsAgainst}
        rank={legendsRank}
        team={team}
      />

      {/* Next match countdown */}
      {nextMatch && (
        <section
          className="bg-[var(--color-primary)] text-white"
          style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)" }}
        >
          <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-red-200 text-xs uppercase tracking-widest font-semibold mb-1">
                {t("nextMatch")}
              </p>
              <h2 className="text-xl md:text-2xl font-bold">{t("versus", { opponent: nextMatch.opponent })}</h2>
              <p className="text-red-200 text-sm mt-0.5">
                {formatDate(nextMatch.date, locale)} · {formatTime(nextMatch.date, locale)} ·{" "}
                <span>{nextMatch.homeAway === "home" ? t("home") : t("away")}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {nextMatch.locationAddress ? (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(nextMatch.locationAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-colors"
                  >
                    📍 {nextMatch.location}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-red-200 text-xs font-medium">
                    📍 {nextMatch.location}
                  </span>
                )}
                {withinForecastWindow(nextMatch.date) && LOCATION_COORDS[nextMatch.location] && (
                  <GameWeather
                    lat={LOCATION_COORDS[nextMatch.location].lat}
                    lng={LOCATION_COORDS[nextMatch.location].lng}
                    gameIso={nextMatch.date}
                    dark
                  />
                )}
              </div>
              {nextMatch.arrivalDate && (
                <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-white/20 border border-white/40 text-white text-base font-bold backdrop-blur-sm">
                  ⏰ {t("beThereAt")} {formatTime(nextMatch.arrivalDate, locale)}
                </div>
              )}
            </div>
            <CountdownTimerClient targetDate={nextMatch.date} />
          </div>
        </section>
      )}

      {/* Team tabs + content */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-2">
        <TeamTabs activeTeam={team} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Results */}
        <section className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mt-6 mb-3">
            {t("recentResults")}
          </h3>
          <div className="flex flex-col gap-2">
            {recentResults.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">{t("versus", { opponent: m.opponent })}</p>
                  <p className="text-xs text-gray-400">{formatDate(m.date, locale)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">
                    {m.goalsFor}–{m.goalsAgainst}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${resultColors[m.result!]}`}>
                    {m.result}
                  </span>
                </div>
              </div>
            ))}
            {recentResults.length === 0 && (
              <p className="text-gray-400 text-sm">{t("noResults")}</p>
            )}
          </div>

          <Link
            href={`/schedule?team=${team}`}
            className="block text-center mt-4 text-sm text-[var(--color-primary)] font-medium hover:underline"
          >
            {t("fullSchedule")}
          </Link>
        </section>

        {/* Latest News */}
        <section className="lg:col-span-2">
          {latestAnnouncement ? (
            <div className="mb-6">
              <AnnouncementBanner announcement={latestAnnouncement} locale={locale} team={team} showAllLink />
            </div>
          ) : (
            <div className="mb-6">
              <Link
                href={`/announcements?team=${team}`}
                className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-semibold hover:underline"
              >
                <span aria-hidden>📣</span>
                {locale === "es" ? "Ver anuncios anteriores →" : "View past announcements →"}
              </Link>
            </div>
          )}
          <h2 className="text-lg font-bold text-gray-800 mb-4">{t("latestNews")}</h2>
          <div className="flex flex-col gap-4">
            {topNews.map((post) => (
              <TrackedLink key={post.id} href={`/news/${post.slug}?team=${team}`} eventName="news_click" eventProps={{ slug: post.slug, team }}>
                <article className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-green-200 transition-all">
                  <p className="text-xs text-gray-400 mb-1">
                    {new Date(post.publishedAt).toLocaleDateString(locale, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {post.author}
                  </p>
                  <h3 className="font-bold text-gray-800 text-base md:text-lg mb-1 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2">{post.excerpt}</p>
                  <span className="inline-block mt-3 text-xs font-semibold text-[var(--color-primary)]">
                    {t("readMore")}
                  </span>
                </article>
              </TrackedLink>
            ))}
            {topNews.length === 0 && (
              <p className="text-gray-400 text-sm">{t("noPosts")}</p>
            )}
          </div>
          <Link
            href={`/news?team=${team}`}
            className="block text-center mt-4 text-sm text-[var(--color-primary)] font-medium hover:underline"
          >
            {t("allAnnouncements")}
          </Link>
        </section>
      </div>
      {/* Sponsors */}
      <section className="bg-[var(--color-navy)] mt-8">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <p className="text-xs text-red-400 uppercase tracking-widest font-semibold text-center mb-1">{ts("poweredBy")}</p>
          <h2 className="text-2xl font-black text-white text-center mb-2">{ts("heading")}</h2>
          <p className="text-red-300 text-sm text-center max-w-lg mx-auto mb-10">{ts("subheading")}</p>

          {/* Current sponsors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            {/* Houk Air Conditioning */}
            <TrackedAnchor
              href="https://houkac.com/"
              target="_blank"
              rel="noopener noreferrer"
              eventName="sponsor_logo_click"
              eventProps={{ sponsor: "houk_ac" }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center gap-3 hover:bg-white/10 transition-colors"
            >
              <div className="h-16 flex items-center justify-center">
                <Image src="/sponsors/houk-logo.svg" alt="Houk Air Conditioning" width={160} height={43} className="object-contain" />
              </div>
              <div>
                <p className="text-white font-black text-lg leading-tight">Houk Air Conditioning</p>
                <p className="text-red-300 text-xs mt-1">Heating, Cooling & HVAC Services</p>
                <p className="text-[var(--color-accent)] text-xs mt-1 font-medium">houkac.com ↗</p>
              </div>
            </TrackedAnchor>

            {/* Bonilla's Painting */}
            <TrackedAnchor
              href="https://www.facebook.com/p/Bonillas-Painting-LLC-100090721931900/"
              target="_blank"
              rel="noopener noreferrer"
              eventName="sponsor_logo_click"
              eventProps={{ sponsor: "bonillas_painting" }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center gap-3 hover:bg-white/10 transition-colors"
            >
              <div className="h-16 flex items-center justify-center bg-white rounded-xl px-3 py-1">
                <Image src="/sponsors/bonillas-logo.png" alt="Bonilla's Painting LLC" width={200} height={60} className="object-contain" />
              </div>
              <div>
                <p className="text-white font-black text-lg leading-tight">Bonilla&apos;s Painting LLC</p>
                <p className="text-red-300 text-xs mt-1">Professional Painting Services</p>
                <p className="text-[var(--color-accent)] text-xs mt-1 font-medium">Facebook ↗</p>
              </div>
            </TrackedAnchor>
          </div>

          {/* Become a sponsor CTA */}
          <div className="border border-[var(--color-accent)]/40 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5">
            <div>
              <p className="text-white font-black text-base">{ts("becomeHeading")}</p>
              <p className="text-red-300 text-sm mt-0.5">{ts("becomeBody")}</p>
            </div>
            <TrackedAnchor
              href="mailto:legendsfcnorth@gmail.com?subject=Sponsorship%20Inquiry%20—%20North%20Legends%20FC"
              eventName="sponsor_cta_click"
              className="shrink-0 px-6 py-3 bg-[var(--color-accent)] text-[var(--color-navy)] font-black rounded-xl hover:opacity-90 transition-opacity text-sm whitespace-nowrap"
            >
              {ts("becomeButton")}
            </TrackedAnchor>
          </div>
        </div>
      </section>
    </>
  );
}
