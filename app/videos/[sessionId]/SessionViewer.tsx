"use client";

import { useRef, useState } from "react";
import type { PracticeSession, SessionVideo, VideoClip } from "@/lib/types";
import FieldHeatmap from "@/components/FieldHeatmap";
import ActivityTimeline from "@/components/ActivityTimeline";

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// 0–30 min = 1st half, 30–62 min = 2nd half, 62min+ = celebration
function clipSection(clip: VideoClip): "celebration" | "second" | "first" {
  if (clip.clipType === "celebration") return "celebration";
  if (clip.clipType === "goal") return clip.startSeconds < 1800 ? "first" : "second";
  if (clip.startSeconds >= 3720) return "celebration";
  if (clip.startSeconds >= 1800) return "second";
  return "first";
}

const SECTION_META = {
  first:       { label: "1st Half",    color: "bg-blue-500",   badge: "bg-blue-50 text-blue-700 border-blue-200" },
  second:      { label: "2nd Half",    color: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  celebration: { label: "Celebration 🎉", color: "bg-yellow-400", badge: "bg-yellow-50 text-yellow-800 border-yellow-200" },
};

const TYPE_BADGE: Record<string, string> = {
  goal:        "⚽ Goal",
  celebration: "🎉 Celebration",
  highlight:   "",
};

export default function SessionViewer({ session }: { session: PracticeSession }) {
  const [activeVideo, setActiveVideo] = useState<SessionVideo>(session.videos[0]);
  const [activeClipUrl, setActiveClipUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  function seekTo(seconds: number) {
    const clip = activeVideo.clips.reduce((best, c) => {
      const dist = (t: typeof c) => Math.abs((t.startSeconds + t.endSeconds) / 2 - seconds);
      return dist(c) < dist(best) ? c : best;
    }, activeVideo.clips[0]);
    if (clip) playClip(clip.r2Url);
  }

  function playClip(url: string) {
    setActiveClipUrl(url);
    setIsLoading(true);
    const vid = videoRef.current;
    if (vid) {
      vid.src = url;
      vid.load();
      vid.play().catch(() => {});
    }
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!activeVideo) return null;

  // Group clips by section
  const sections = (["first", "second", "celebration"] as const).map((key) => ({
    key,
    ...SECTION_META[key],
    clips: activeVideo.clips.filter((c) => clipSection(c) === key),
  })).filter((s) => s.clips.length > 0);

  // Goals only
  const goals = activeVideo.clips.filter((c) => c.clipType === "goal");

  // Full-game Drive URL — use first video that has one
  const driveUrl = session.videos.find((v) => v.driveUrl)?.driveUrl;

  return (
    <div>
      {/* Full-game Drive download banner */}
      {driveUrl && (
        <a
          href={driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#1a73e8] to-[#0d47a1] text-white shadow-lg hover:shadow-xl hover:brightness-110 transition-all group"
        >
          {/* Drive icon */}
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
            <p className="font-black text-base leading-tight">Full Game · Google Drive</p>
            <p className="text-white/75 text-sm mt-0.5">18 GB · original 4K quality · tap to open</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full group-hover:bg-white/30 transition-colors">
              Open ↗
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
              onClick={() => { setActiveVideo(v); setActiveClipUrl(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeVideo.id === v.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Video {i + 1} · {v.resolution} · {fmt(v.durationSeconds)}
            </button>
          ))}
        </div>
      )}

      {/* Player */}
      <div ref={playerRef} className="relative rounded-2xl overflow-hidden bg-black shadow-xl">
        <video
          ref={videoRef}
          poster={activeVideo.thumbnailUrl || undefined}
          controls
          playsInline
          className="w-full max-h-[70vh]"
          preload={activeClipUrl ? "auto" : "none"}
          onCanPlay={() => setIsLoading(false)}
          onWaiting={() => setIsLoading(true)}
          onProgress={() => { if (isLoading && videoRef.current && videoRef.current.readyState >= 3) setIsLoading(false); }}
        />
        {/* Loading overlay */}
        {isLoading && activeClipUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-white text-sm font-semibold">Loading clip…</span>
            </div>
          </div>
        )}
        {/* Tap-to-play hint when nothing selected */}
        {!activeClipUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-white/80 text-sm font-medium">Tap a clip to play</p>
            </div>
          </div>
        )}
      </div>

      {/* Now playing label */}
      <div className="mt-2 mb-6 h-5">
        {activeClipUrl && !isLoading && (
          <p className="text-xs text-gray-400 font-medium">
            {activeVideo.clips.find(c => c.r2Url === activeClipUrl)?.label ?? "Playing"} · tap ↓ to download
          </p>
        )}
      </div>

      {/* Goals quick-access — only if goals are tagged */}
      {goals.length > 0 && (
        <section className="mb-8 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚽</span>
            <h2 className="text-sm font-black text-green-800 uppercase tracking-wide">Goals</h2>
            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{goals.length}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {goals.map((c) => (
              <button
                key={c.id}
                onClick={() => playClip(c.r2Url)}
                className={`px-3 py-1.5 border text-sm font-semibold rounded-full transition-colors ${
                  activeClipUrl === c.r2Url
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-green-800 border-green-300 hover:bg-green-100"
                }`}
              >
                ⚽ {c.label}
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
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide">All Moments</h2>
            <span className="text-xs text-gray-400">{activeVideo.markers.length} highlights · tap to jump</span>
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
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide">Game Analytics</h2>
          </div>
          <FieldHeatmap analytics={activeVideo.analytics} />
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
              {section.clips.length} clips
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {section.clips.map((clip) => {
              const isPlaying = activeClipUrl === clip.r2Url;
              const typeBadge = TYPE_BADGE[clip.clipType ?? "highlight"];
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
                      {isPlaying ? "Playing" : "Play"}
                    </div>
                  </button>
                  <a
                    href={clip.r2Url}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-1 py-1.5 border-t border-gray-100 text-[10px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
