"use client";

import { useRef, useState } from "react";
import type { PracticeSession, SessionVideo } from "@/lib/types";
import FieldHeatmap from "@/components/FieldHeatmap";
import ActivityTimeline from "@/components/ActivityTimeline";

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SessionViewer({ session }: { session: PracticeSession }) {
  const [activeVideo, setActiveVideo] = useState<SessionVideo>(session.videos[0]);
  const firstClip = session.videos[0]?.clips[0]?.r2Url ?? null;
  const [activeClipUrl, setActiveClipUrl] = useState<string | null>(firstClip);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentSrc = activeClipUrl ?? "";

  function seekTo(seconds: number) {
    // Find the clip whose window contains or is closest to this marker time
    const clip = activeVideo.clips.reduce((best, c) => {
      const dist = (t: typeof c) => Math.abs((t.startSeconds + t.endSeconds) / 2 - seconds);
      return dist(c) < dist(best) ? c : best;
    }, activeVideo.clips[0]);
    if (clip) playClip(clip.r2Url);
  }

  function playClip(url: string) {
    setActiveClipUrl(url);
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }

  if (!activeVideo) return null;

  return (
    <div>
      {/* Video selector tabs (only if multiple videos) */}
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
      <div className="relative rounded-2xl overflow-hidden bg-black shadow-xl">
        <video
          ref={videoRef}
          key={currentSrc}
          src={currentSrc}
          controls
          playsInline
          className="w-full max-h-[70vh]"
          preload="metadata"
        />
      </div>

      {/* Video info */}
      <div className="flex items-center mt-3 mb-6">
        <p className="text-sm text-gray-500">
          {activeClipUrl ? "Playing highlight clip — tap Download to save" : "Select a highlight clip below"}
        </p>
      </div>

      {/* Markers — quick seek chips */}
      {activeVideo.markers.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-5 rounded-full bg-[var(--color-accent)]" />
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide">Jump to Marker</h2>
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
        <section className="mb-8 space-y-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-5 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide">Session Analytics</h2>
          </div>
          <FieldHeatmap analytics={activeVideo.analytics} />
          <ActivityTimeline analytics={activeVideo.analytics} />
        </section>
      )}

      {/* Highlight clips grid */}
      {activeVideo.clips.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 rounded-full bg-[var(--color-primary)]" />
            <h2 className="text-base font-black text-gray-800">Highlight Clips</h2>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {activeVideo.clips.length} clips
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeVideo.clips.map((clip) => {
              const isPlaying = activeClipUrl === clip.r2Url;
              return (
                <div
                  key={clip.id}
                  className={`bg-white rounded-xl overflow-hidden border transition-all shadow-sm ${
                    isPlaying
                      ? "border-[var(--color-primary)] shadow-md"
                      : "border-gray-100 hover:shadow-md hover:border-[var(--color-accent)]/40"
                  }`}
                >
                  <div className="p-4">
                    <p className="font-semibold text-gray-800 text-sm">{clip.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmt(clip.startSeconds)} – {fmt(clip.endSeconds)}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => playClip(clip.r2Url)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          isPlaying
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-red-50 text-[var(--color-primary)] hover:bg-red-100"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        {isPlaying ? "Playing" : "Play"}
                      </button>
                      <a
                        href={clip.r2Url}
                        download
                        className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        title="Download clip"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Other videos in the session */}
      {session.videos.length > 1 && (
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 rounded-full bg-gray-300" />
            <h2 className="text-base font-black text-gray-800">All Session Videos</h2>
          </div>
          <div className="flex flex-col gap-3">
            {session.videos.map((v, i) => (
              <div
                key={v.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  activeVideo.id === v.id
                    ? "border-[var(--color-primary)] bg-red-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Video {i + 1}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{v.resolution} · {fmt(v.durationSeconds)}</p>
                </div>
                <button
                  onClick={() => { setActiveVideo(v); setActiveClipUrl(null); }}
                  className="px-3 py-1.5 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  View clips
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
