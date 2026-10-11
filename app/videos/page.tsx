import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import TeamTabs from "@/components/TeamTabs";
import VideoCollectionFolder from "@/components/VideoCollectionFolder";
import { getSessionsByTeam, getHighlightVideosByTeam } from "@/lib/sanity/queries";
import type { TeamSlug } from "@/lib/sanity/queries";
import type { PracticeSession, HighlightVideo } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Videos");
  return { title: t("metaTitle") };
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function totalClips(session: PracticeSession) {
  return session.videos.reduce((n, v) => n + v.clips.length, 0);
}

function totalDuration(session: PracticeSession) {
  return session.videos.reduce((n, v) => n + v.durationSeconds, 0);
}

function thumbnail(session: PracticeSession) {
  return session.videos.find((v) => v.thumbnailUrl)?.thumbnailUrl ?? null;
}

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const team: TeamSlug = teamParam === "u12" ? "u12" : "u11";
  const t = await getTranslations("Videos");
  const locale = await getLocale();
  const [sessions, highlightVideos] = await Promise.all([
    getSessionsByTeam(team),
    getHighlightVideosByTeam(team),
  ]);

  // Group YouTube highlights by event
  const ytByEvent = highlightVideos.reduce<Record<string, HighlightVideo[]>>((acc, v) => {
    (acc[v.event] ??= []).push(v);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-6 h-6 text-[var(--color-primary)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <h1 className="text-3xl font-black text-gray-900">{t("heading")}</h1>
          </div>
          <p className="text-gray-500 text-sm">{t("subtitle")}</p>
        </div>
        <TeamTabs activeTeam={team} />
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-gray-400 text-lg font-medium">{t("noVideos")}</p>
          <p className="text-gray-300 text-sm mt-1">{t("noVideosHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const thumb = thumbnail(session);
            const clips = totalClips(session);
            const dur = totalDuration(session);

            return (
              <Link
                key={session.id}
                href={`/videos/${session.id}?team=${team}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-[var(--color-accent)]/40 transition-all"
              >
                {/* Thumbnail */}
                <div className="relative w-full bg-[var(--color-navy)] overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={session.sessionName}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />

                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
                      <svg className="w-6 h-6 text-[var(--color-primary)] ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Type badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full tracking-wider ${
                      session.sessionType === "GAME"
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-accent)] text-[#1c1c1e]"
                    }`}>
                      {session.sessionType === "GAME" ? t("game") : t("practice")}
                    </span>
                  </div>

                  {/* Duration */}
                  {dur > 0 && (
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {formatDuration(dur)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="font-bold text-gray-900 text-base leading-snug">{session.sessionName}</p>
                  {session.sessionDate && (
                    <p className="text-xs text-gray-400 mt-1">{formatDate(session.sessionDate, locale)}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-gray-500">
                      {t("videoCount", { count: session.videos.length })}
                    </span>
                    {clips > 0 && (
                      <span className="text-xs font-semibold text-[var(--color-primary)] bg-red-50 px-2 py-0.5 rounded-full">
                        {t("highlightCount", { count: clips })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* YouTube Collections — collapsible folders */}
      {Object.keys(ytByEvent).length > 0 && (
        <div className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-7 rounded-full bg-[var(--color-accent)]" />
            <h2 className="text-2xl font-black text-gray-900">{t("collectionsHeading")}</h2>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{t("youtube")}</span>
          </div>
          <div className="flex flex-col gap-3">
            {Object.entries(ytByEvent).map(([event, clips]) => (
              <VideoCollectionFolder key={event} event={event} clips={clips} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
