import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import CountdownTimerClient from "@/components/CountdownTimerClient";
import TeamTabs from "@/components/TeamTabs";
import {
  getMatchesByTeam,
  getPostsByTeam,
  getSeasonStatsByTeam,
  getNextMatchByTeam,
} from "@/lib/sanity/queries";
import type { TeamSlug } from "@/lib/sanity/queries";

const formatDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const formatTime = (iso: string, locale: string) =>
  new Date(iso).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });

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

  const t = await getTranslations("Home");
  const locale = await getLocale();

  const [nextMatch, stats, matches, latestNews] = await Promise.all([
    getNextMatchByTeam(team),
    getSeasonStatsByTeam(team),
    getMatchesByTeam(team),
    getPostsByTeam(team),
  ]);

  const recentResults = matches
    .filter((m) => m.result !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const topNews = latestNews.slice(0, 2);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-[var(--color-navy)] overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/Legends_hero_video.mp4" type="video/mp4" />
        </video>
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
            <Link
              href={`/schedule?team=${team}`}
              className="px-5 py-2.5 bg-[var(--color-accent)] text-[#1c1c1e] font-bold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors shadow-md"
            >
              {t("viewSchedule")}
            </Link>
            <Link
              href={`/roster?team=${team}`}
              className="px-5 py-2.5 bg-[var(--color-accent)] text-[#1c1c1e] font-bold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors shadow-md"
            >
              {t("meetTheTeam")}
            </Link>
          </div>
        </div>
      </section>

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
              <p className="text-red-300 text-xs mt-0.5">{nextMatch.location}</p>
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
        {/* Season Stats */}
        <section className="lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-800 mb-4">{t("seasonRecord")}</h2>
          <div className="bg-[var(--color-navy)] text-white rounded-xl p-5 shadow-md">
            <div className="grid grid-cols-3 gap-3 text-center mb-5">
              {[
                { label: t("wins"), value: stats.wins, color: "text-green-400" },
                { label: t("draws"), value: stats.draws, color: "text-yellow-400" },
                { label: t("losses"), value: stats.losses, color: "text-red-400" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className={`text-3xl font-black ${color}`}>{value}</p>
                  <p className="text-xs text-red-300 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-red-900/40 pt-4 grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{stats.goalsFor}</p>
                <p className="text-xs text-red-300">{t("goalsScored")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.goalsAgainst}</p>
                <p className="text-xs text-red-300">{t("goalsConceded")}</p>
              </div>
            </div>
          </div>

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
          <h2 className="text-lg font-bold text-gray-800 mb-4">{t("latestNews")}</h2>
          <div className="flex flex-col gap-4">
            {topNews.map((post) => (
              <Link key={post.id} href={`/news/${post.slug}?team=${team}`}>
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
              </Link>
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
    </>
  );
}
