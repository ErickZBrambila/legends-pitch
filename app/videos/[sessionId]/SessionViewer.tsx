"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { PracticeSession, SessionVideo, VideoClip } from "@/lib/types";
import FieldHeatmap from "@/components/FieldHeatmap";
import ActivityTimeline from "@/components/ActivityTimeline";

const SAVED_KEY = "nlfc_saved_clips";

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function clipSection(clip: VideoClip): "saves" | "celebration" | "second" | "first" {
  if (clip.clipType === "shot_on_target") return "saves";
  if (clip.clipType === "celebration") return "celebration";
  if (clip.clipType === "goal") return clip.startSeconds < 1800 ? "first" : "second";
  if (clip.startSeconds >= 3720) return "celebration";
  if (clip.startSeconds >= 1800) return "second";
  return "first";
}

const SECTION_STYLE = {
  first:       { labelKey: "firstHalf",   color: "bg-blue-500",   badge: "bg-blue-50 text-blue-700 border-blue-200" },
  second:      { labelKey: "secondHalf",  color: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  celebration: { labelKey: "celebration", color: "bg-yellow-400", badge: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  saves:       { labelKey: "shotsOnTargetSection", color: "bg-green-500",  badge: "bg-green-50 text-green-700 border-green-200" },
} as const;

const TYPE_BADGE_KEY: Record<string, string> = {
  goal:           "goalBadge",
  celebration:    "celebrationBadge",
  shot_on_target: "shotBadge",
  highlight:      "",
};

function SaveButton({
  clip,
  sessionId,
  videoKey,
  saved,
  onSave,
}: {
  clip: VideoClip;
  sessionId: string;
  videoKey: string;
  saved: boolean;
  onSave: (clipId: string) => void;
}) {
  const t = useTranslations("Session");
  const [saving, setSaving] = useState(false);
  const [localCount, setLocalCount] = useState(clip.saveCount);

  async function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (saved || saving) return;
    setSaving(true);
    setLocalCount((n) => n + 1);
    onSave(clip.id);
    try {
      await fetch("/api/clip-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, videoKey, clipKey: clip.id }),
      });
    } catch {
      // optimistic count stays — Sanity will sync next page load
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-t border-gray-100">
      <span className="text-[10px] text-gray-400">
        {localCount > 0 ? t("savedCount", { count: localCount }) : t("beFirst")}
      </span>
      <button
        onClick={handleSave}
        disabled={saved}
        className={`flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-1 transition-all ${
          saved
            ? "text-red-500 bg-red-50"
            : "text-gray-400 hover:text-red-400 hover:bg-red-50 active:scale-110"
        }`}
        title={saved ? t("savedTitle") : t("saveTitle")}
      >
        <svg
          className="w-3.5 h-3.5"
          fill={saved ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {saved ? t("saved") : t("save")}
      </button>
    </div>
  );
}

function getFirstClip(video: SessionVideo) {
  return video.clips.find((c) => !c.archived) ?? null;
}

export default function SessionViewer({ session }: { session: PracticeSession }) {
  const t = useTranslations("Session");
  const [activeVideo, setActiveVideo] = useState<SessionVideo>(session.videos[0]);
  const [activeClipUrl, setActiveClipUrl] = useState<string | null>(
    () => getFirstClip(session.videos[0])?.r2Url ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [savedClips, setSavedClips] = useState<Set<string>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const pendingPlay = useRef(false);
  // true while we're chaining through goals; false once user picks a non-goal clip
  const goalsModeRef = useRef(false);

  // Load saved clips from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) setSavedClips(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);

  // On mount / video-tab change: auto-play first goal if available, else preload first clip
  useEffect(() => {
    const goals = activeVideo.clips.filter((c) => c.clipType === "goal" && !c.archived);
    const firstGoal = goals[0] ?? null;
    const firstClip = getFirstClip(activeVideo);
    const vid = videoRef.current;
    if (!vid) return;

    if (firstGoal) {
      goalsModeRef.current = true;
      setActiveClipUrl(firstGoal.r2Url);
      vid.pause();
      vid.src = firstGoal.r2Url;
      vid.load();
      pendingPlay.current = true; // auto-play
    } else if (firstClip) {
      goalsModeRef.current = false;
      setActiveClipUrl(firstClip.r2Url);
      vid.pause();
      vid.src = firstClip.r2Url;
      vid.load();
      // pendingPlay stays false — preload only
    } else {
      setActiveClipUrl(null);
      vid.removeAttribute("src");
      vid.load();
    }
  }, [activeVideo.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update iOS/Android media session metadata so lock screen shows North Legends branding
  useEffect(() => {
    if (!activeClipUrl || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const clip = activeVideo.clips.find((c) => c.r2Url === activeClipUrl);
    if (!clip) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: clip.label,
      artist: session.sessionName,
      album: "North Legends FC · KickReel",
      artwork: [
        { src: "/logo.jpg", sizes: "512x512", type: "image/jpeg" },
      ],
    });
  }, [activeClipUrl, activeVideo.clips, session.sessionName]);

  // Prefetch next 2 non-archived clips while current one plays
  useEffect(() => {
    if (!activeClipUrl) return;
    const playable = activeVideo.clips.filter((c) => !c.archived);
    const idx = playable.findIndex((c) => c.r2Url === activeClipUrl);
    const upcoming = playable.slice(idx + 1, idx + 3);
    const injected: HTMLLinkElement[] = upcoming.map((clip) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = clip.r2Url;
      link.as = "video";
      document.head.appendChild(link);
      return link;
    });
    return () => injected.forEach((l) => l.remove());
  }, [activeClipUrl, activeVideo.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback((clipId: string) => {
    setSavedClips((prev) => {
      const next = new Set(prev);
      next.add(clipId);
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  function seekTo(seconds: number) {
    const clip = activeVideo.clips.reduce((best, c) => {
      const dist = (t: typeof c) => Math.abs((t.startSeconds + t.endSeconds) / 2 - seconds);
      return dist(c) < dist(best) ? c : best;
    }, activeVideo.clips[0]);
    if (clip) playClip(clip.r2Url, clip.clipType === "goal");
  }

  function playClip(url: string, isGoal = false) {
    goalsModeRef.current = isGoal;
    setActiveClipUrl(url);
    setIsLoading(true);
    pendingPlay.current = true;
    const vid = videoRef.current;
    if (vid) {
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
      vid.src = url;
      vid.load();
    }
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!activeVideo) return null;

  const playableClips = activeVideo.clips.filter((c) => !c.archived);
  const currentClipIdx = playableClips.findIndex((c) => c.r2Url === activeClipUrl);
  const currentClip = playableClips[currentClipIdx] ?? null;

  function handleEnded() {
    if (!goalsModeRef.current) return;
    const goals = activeVideo.clips.filter((c) => c.clipType === "goal" && !c.archived);
    const idx = goals.findIndex((c) => c.r2Url === activeClipUrl);
    const nextGoal = goals[idx + 1];
    if (nextGoal) {
      playClip(nextGoal.r2Url);
    } else {
      goalsModeRef.current = false; // all goals played — stop chaining
    }
  }

  const sections = (["first", "second", "celebration", "saves"] as const).map((key) => ({
    key,
    label: t(SECTION_STYLE[key].labelKey),
    color: SECTION_STYLE[key].color,
    badge: SECTION_STYLE[key].badge,
    clips: activeVideo.clips.filter((c) => clipSection(c) === key),
  })).filter((s) => s.clips.length > 0);

  const goals = activeVideo.clips.filter((c) => c.clipType === "goal");
  const rivalGoals = activeVideo.clips.filter((c) => c.clipType === "rival_goal");
  const driveUrl = session.videos.find((v) => v.driveUrl)?.driveUrl;

  return (
    <div className="fold-two-panel">
    {/* ── LEFT PANEL (sticky video) on foldable, full-width on normal screens ── */}
    <div className="fold-panel-left">
      {/* Full-game Drive download banner */}
      {driveUrl && (
        <a
          href={driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#1a73e8] to-[#0d47a1] text-white shadow-lg hover:shadow-xl hover:brightness-110 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
            <svg className="w-7 h-7" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="M43.65 25L29.9 1.4C28.55.5 27 0 25.35 0H6.6L0 11.5c0 1.55.4 3.1 1.2 4.5L27.5 53 43.65 25z" fill="#00ac47"/>
              <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8L73.55 76.8z" fill="#ea4335"/>
              <path d="M43.65 25L57.4 1.4C56.05.5 54.5 0 52.85 0H34.15c-1.65 0-3.2.5-4.55 1.4L43.65 25z" fill="#00832d"/>
              <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#2684fc"/>
              <path d="M73.4 26.5L60.2 4c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.3c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-base leading-tight">{t("fullGameDrive")}</p>
            <p className="text-white/75 text-sm mt-0.5">{t("fullGameDriveMeta")}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full group-hover:bg-white/30 transition-colors">
              {t("open")}
            </span>
          </div>
        </a>
      )}

      {/* Video selector tabs */}
      {session.videos.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {session.videos.map((v, i) => (
            <button
              key={v.id}
              onClick={() => setActiveVideo(v)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeVideo.id === v.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t("videoLabel", { index: i + 1, resolution: v.resolution, duration: fmt(v.durationSeconds) })}
            </button>
          ))}
        </div>
      )}

      {/* Now playing — clip heading (above video) */}
      <div className="mb-2 min-h-[48px]">
        {currentClip ? (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                {t("clipIndex", { current: currentClipIdx + 1, total: playableClips.length })}
              </p>
              <h3 className="text-lg font-black text-gray-900 leading-snug mt-0.5">
                {currentClip.label}
              </h3>
            </div>
            {isLoading && (
              <span className="shrink-0 text-[11px] text-gray-400 mt-1">{t("loadingClip")}</span>
            )}
          </div>
        ) : null}
      </div>

      {/* Player */}
      <div ref={playerRef} className="relative rounded-2xl overflow-hidden bg-black shadow-xl">
        <video
          ref={videoRef}
          controls
          playsInline
          poster={activeVideo.thumbnailUrl || undefined}
          className="w-full max-h-[70vh]"
          preload="auto"
          onCanPlay={() => {
            setIsLoading(false);
            if (pendingPlay.current) {
              pendingPlay.current = false;
              videoRef.current?.play().catch(() => {});
            }
          }}
          onPlaying={() => setIsLoading(false)}
          onWaiting={() => setIsLoading(true)}
          onStalled={() => setIsLoading(true)}
          onEnded={handleEnded}
        />
        {isLoading && activeClipUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-white text-sm font-semibold">{t("loadingClip")}</span>
            </div>
          </div>
        )}
      </div>

      {/* Known bug notice — video slowness */}
      <div className="fold-hide mt-3 mb-6 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
        <span className="shrink-0 font-black mt-0.5">⚠</span>
        <p>
          <span className="font-black">Videos loading slowly?</span> We&apos;re waiting on a CDN fix (northlegensfc.com domain) — clips currently load direct from storage. Thanks for your patience!
        </p>
      </div>
    </div>
    {/* ── RIGHT PANEL (goals, clips, analytics) on foldable ── */}
    <div className="fold-panel-right">

      {/* Goals quick-access */}
      {goals.length > 0 && (
        <section className="mb-8 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚽</span>
            <h2 className="text-sm font-black text-green-800 uppercase tracking-wide">{t("goals")}</h2>
            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{goals.length}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {goals.map((c, i) => (
              <button
                key={c.id}
                onClick={() => playClip(c.r2Url, true)}
                className={`px-3 py-1.5 border text-sm font-semibold rounded-full transition-colors ${
                  activeClipUrl === c.r2Url
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-green-800 border-green-300 hover:bg-green-100"
                }`}
              >
                ⚽ {i + 1} · {c.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Rival goals */}
      {rivalGoals.length > 0 && (
        <section className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🚨</span>
            <h2 className="text-sm font-black text-red-800 uppercase tracking-wide">{t("conceded")}</h2>
            <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{rivalGoals.length}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {rivalGoals.map((c, i) => (
              <button
                key={c.id}
                onClick={() => playClip(c.r2Url, false)}
                className={`px-3 py-1.5 border text-sm font-semibold rounded-full transition-colors ${
                  activeClipUrl === c.r2Url
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-red-800 border-red-300 hover:bg-red-100"
                }`}
              >
                🚨 {i + 1} · {c.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Marker chips */}
      {activeVideo.markers.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-5 rounded-full bg-[var(--color-accent)]" />
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide">{t("allMoments")}</h2>
            <span className="text-xs text-gray-400">{t("momentsHint", { count: activeVideo.markers.length })}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeVideo.markers.map((m) => (
              <button
                key={m.id}
                onClick={() => seekTo(m.timeSeconds)}
                className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-full hover:bg-amber-100 transition-colors"
              >
                ▶ {m.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Analytics */}
      {activeVideo.analytics && (
        <section className="mb-10 space-y-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-5 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide">{t("gameAnalytics")}</h2>
          </div>
          {(activeVideo.analytics.shotsOnTarget != null || activeVideo.analytics.saves != null) && (
            <div className="flex gap-4">
              {activeVideo.analytics.shotsOnTarget != null && (
                <div className="flex-1 rounded-2xl bg-gray-50 border border-gray-100 p-4 text-center">
                  <p className="text-3xl font-black text-gray-900">{activeVideo.analytics.shotsOnTarget}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wide">{t("shotsOnTarget")}</p>
                </div>
              )}
              {activeVideo.analytics.saves != null && (
                <div className="flex-1 rounded-2xl bg-green-50 border border-green-100 p-4 text-center">
                  <p className="text-3xl font-black text-green-700">{activeVideo.analytics.saves}</p>
                  <p className="text-xs font-semibold text-green-600 mt-1 uppercase tracking-wide">{t("savesCount")}</p>
                </div>
              )}
            </div>
          )}
          <FieldHeatmap analytics={activeVideo.analytics} />
          {(activeVideo.analytics.shotsOnTarget ?? 0) > 0 && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3">Shot Stats</p>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">{activeVideo.analytics.shotsOnTarget}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Shots on Target</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-600">{activeVideo.analytics.saves}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Saves</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-amber-500">
                    {(activeVideo.analytics.shotEvents ?? []).filter(e => e.resultedInGoal).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Goals</p>
                </div>
              </div>
            </div>
          )}
          <ActivityTimeline analytics={activeVideo.analytics} clips={activeVideo.clips} markers={activeVideo.markers} />
        </section>
      )}

      {/* Clips grouped by half */}
      {sections.map((section) => (
        <section key={section.key} className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-1 h-5 rounded-full ${section.color}`} />
            <h2 className="text-base font-black text-gray-800">{section.label}</h2>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {t("clipsCount", { count: section.clips.length })}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {section.clips.map((clip) => {
              const isPlaying = activeClipUrl === clip.r2Url;
              const typeBadgeKey = TYPE_BADGE_KEY[clip.clipType ?? "highlight"];
              const typeBadge = typeBadgeKey ? t(typeBadgeKey) : "";
              const isSaved = savedClips.has(clip.id);

              // Archived clip — greyed out card
              if (clip.archived) {
                return (
                  <div key={clip.id} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 opacity-60">
                    <div className="p-3">
                      {typeBadge && (
                        <span className={`inline-block text-[10px] font-black px-1.5 py-0.5 rounded-full border mb-1.5 ${section.badge}`}>
                          {typeBadge}
                        </span>
                      )}
                      <p className="font-semibold text-gray-500 text-xs leading-snug">{clip.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{fmt(clip.startSeconds)} – {fmt(clip.endSeconds)}</p>
                      <div className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 text-gray-400">
                        {t("archived", { count: clip.saveCount })}
                      </div>
                    </div>
                    {driveUrl && (
                      <a
                        href={driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 py-1.5 border-t border-gray-200 text-[10px] font-semibold text-gray-400 hover:bg-gray-100 transition-colors"
                      >
                        {t("fullGameOnDrive")}
                      </a>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={clip.id}
                  className={`bg-white rounded-xl overflow-hidden border transition-all shadow-sm ${
                    isPlaying
                      ? "border-[var(--color-primary)] shadow-md ring-2 ring-[var(--color-primary)]/20"
                      : "border-gray-100 hover:shadow-md hover:border-gray-300"
                  }`}
                >
                  <button
                    onClick={() => playClip(clip.r2Url)}
                    className="w-full p-3 text-left"
                  >
                    {typeBadge && (
                      <span className={`inline-block text-[10px] font-black px-1.5 py-0.5 rounded-full border mb-1.5 ${section.badge}`}>
                        {typeBadge}
                      </span>
                    )}
                    <p className="font-semibold text-gray-800 text-xs leading-snug">{clip.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{fmt(clip.startSeconds)} – {fmt(clip.endSeconds)}</p>
                    <div className={`mt-2 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isPlaying
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      {isPlaying ? t("playing") : t("play")}
                    </div>
                  </button>

                  {/* Save button row */}
                  <SaveButton
                    clip={clip}
                    sessionId={session.id}
                    videoKey={activeVideo.id}
                    saved={isSaved}
                    onSave={handleSave}
                  />

                  <a
                    href={`/api/clip-download?url=${encodeURIComponent(clip.r2Url)}&filename=${encodeURIComponent(clip.label + ".mp4")}`}
                    download={clip.label + ".mp4"}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-1 py-1.5 border-t border-gray-100 text-[10px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t("download")}
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
    </div>
  );
}
