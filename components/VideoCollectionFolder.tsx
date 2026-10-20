"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { HighlightVideo } from "@/lib/types";

function VideoCard({ v }: { v: HighlightVideo }) {
  const [playing, setPlaying] = useState(false);

  if (v.r2Url) {
    return (
      <div className="group rounded-xl overflow-hidden border border-gray-100 hover:shadow-md hover:border-[var(--color-accent)]/30 transition-all bg-gray-50">
        <div className="relative w-full bg-gray-900 overflow-hidden" style={{ paddingBottom: "56.25%" }}>
          {playing ? (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src={v.r2Url}
              controls
              autoPlay
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-110">
                <svg className="w-5 h-5 text-[var(--color-primary)] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          )}
        </div>
        <div className="px-2.5 py-2 flex items-center justify-between gap-1">
          <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 flex-1">{v.title}</p>
          <a
            href={v.r2Url}
            download
            onClick={(e) => e.stopPropagation()}
            className="text-[9px] font-black text-gray-400 hover:text-gray-600 flex-shrink-0 ml-1"
            title="Download"
          >
            ↓
          </a>
        </div>
      </div>
    );
  }

  return (
    <a
      href={`https://youtu.be/${v.youtubeId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-xl overflow-hidden border border-gray-100 hover:shadow-md hover:border-[var(--color-accent)]/30 transition-all bg-gray-50"
    >
      <div className="relative w-full overflow-hidden bg-gray-900" style={{ paddingBottom: "56.25%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`}
          alt={v.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
          <div className="w-10 h-10 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow transition-all group-hover:scale-110">
            <svg className="w-4 h-4 text-[var(--color-primary)] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="px-2.5 py-2">
        <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">{v.title}</p>
      </div>
    </a>
  );
}

export default function VideoCollectionFolder({
  event,
  clips,
}: {
  event: string;
  clips: HighlightVideo[];
}) {
  const t = useTranslations("VideoCollection");
  const [open, setOpen] = useState(false);

  const hasR2 = clips.some((v) => v.r2Url);
  const hasYT = clips.some((v) => v.youtubeId);

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${
      open ? "border-[var(--color-accent)]/40 shadow-md" : "border-gray-100 shadow-sm"
    } bg-white`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
          open ? "bg-[var(--color-accent)]/20" : "bg-amber-50"
        }`}>
          <svg className={`w-6 h-6 transition-colors ${open ? "text-[var(--color-accent)]" : "text-amber-500"}`}
            fill="currentColor" viewBox="0 0 24 24">
            {open
              ? <path d="M20 6h-8l-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2z" />
              : <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
            }
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-base leading-snug truncate">{event}</p>
          <p className="text-xs text-gray-400 mt-0.5">{t("clipsFootage", { count: clips.length })}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {hasYT && (
            <span className="text-[10px] font-black px-2 py-1 rounded-full bg-red-50 text-red-600 tracking-wider">
              YouTube
            </span>
          )}
          {hasR2 && (
            <span className="text-[10px] font-black px-2 py-1 rounded-full bg-blue-50 text-blue-600 tracking-wider">
              Video
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {clips.map((v) => (
              <VideoCard key={v.id} v={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
