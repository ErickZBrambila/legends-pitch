"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

const CDN = "https://pub-ec6efd6486724c999de33694e15dd4dc.r2.dev";
const MUSIC_URL = `${CDN}/music/my-favourite-game.mp3`;

type MediaItem =
  | { type: "photo"; src: string }
  | { type: "video"; src: string; label: string };

const MEDIA: MediaItem[] = [
  { type: "photo",  src: "IMG_3342.jpg" },
  { type: "photo",  src: "IMG_3337.jpg" },
  { type: "photo",  src: "IMG_3331.jpg" },
  { type: "photo",  src: "IMG_3325.jpg" },
  { type: "photo",  src: "IMG_3321.jpg" },
  { type: "photo",  src: "IMG_3318.jpg" },
  { type: "photo",  src: "IMG_3309.jpg" },
  { type: "video",  src: `${CDN}/kickreel/sessions/20261114/clips/VID_20261114_150633_01_01_clip_1352s.mp4`, label: "⚽ vs Elgin United · 22:32" },
  { type: "photo",  src: "IMG_3303.jpg" },
  { type: "photo",  src: "IMG_3296.jpg" },
  { type: "photo",  src: "IMG_3295.jpg" },
];

const KEY = "u11_thankyou_v1";
const PHOTO_MS = 2400;

type Phase = "slideshow" | "card" | "gone";

interface Props {
  wins: number;
  losses: number;
  draws: number;
}

export default function U11ThankYouSplash({ wins, losses, draws }: Props) {
  const t = useTranslations("Championship");
  const [phase, setPhase] = useState<Phase>("gone");
  const [idx, setIdx] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) {
      const timer = setTimeout(() => setPhase("slideshow"), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  // "Watch again" event — fired by the button on the page
  useEffect(() => {
    function replay() {
      setIdx(0);
      setFadeIn(true);
      setMuted(true);
      setPhase("slideshow");
    }
    window.addEventListener("watch-u11-thankyou", replay);
    return () => window.removeEventListener("watch-u11-thankyou", replay);
  }, []);

  // Start music when slideshow begins, fade out on card
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (phase === "slideshow") {
      audio.muted = true; // must set via DOM — React muted prop is unreliable
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } else if (phase === "card") {
      const fadeOut = setInterval(() => {
        if (audio.volume > 0.05) {
          audio.volume = Math.max(0, audio.volume - 0.05);
        } else {
          audio.pause();
          clearInterval(fadeOut);
        }
      }, 100);
      return () => clearInterval(fadeOut);
    } else {
      audio.pause();
    }
  }, [phase]);

  const advance = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFadeIn(false);
    setTimeout(() => {
      const next = idx + 1;
      if (next >= MEDIA.length) {
        setPhase("card");
        setFadeIn(true);
      } else {
        setIdx(next);
        setFadeIn(true);
      }
    }, 300);
  };

  // Photo auto-advance
  useEffect(() => {
    if (phase !== "slideshow") return;
    const item = MEDIA[idx];
    if (item.type !== "photo") return;
    timerRef.current = setTimeout(advance, PHOTO_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx]);

  // Autoplay video when item switches to video
  useEffect(() => {
    if (phase !== "slideshow") return;
    const item = MEDIA[idx];
    if (item.type !== "video") return;
    const v = videoRef.current;
    if (v) { v.currentTime = 0; v.play().catch(() => {}); }
  }, [phase, idx]);

  function close() {
    localStorage.setItem(KEY, "seen");
    setPhase("gone");
  }

  function skip() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("card");
    setFadeIn(true);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
    const audio = audioRef.current;
    if (audio) {
      audio.muted = next;
      // Kick off playback on first unmute in case autoplay was blocked
      if (!next && audio.paused) audio.play().catch(() => {});
    }
  }

  if (phase === "gone") return null;

  const current = MEDIA[idx];

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src={MUSIC_URL} loop preload="auto" />
      {/* ── Slideshow ── */}
      {phase === "slideshow" && (
        <>
          <div
            className="absolute inset-0 transition-opacity duration-[300ms]"
            style={{ opacity: fadeIn ? 1 : 0 }}
          >
            {current.type === "photo" ? (
              <>
                <Image
                  key={idx}
                  src={`/championship/${current.src}`}
                  alt=""
                  fill
                  className="object-contain"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/40 pointer-events-none" />
              </>
            ) : (
              /* eslint-disable-next-line jsx-a11y/media-has-caption */
              <video
                ref={videoRef}
                key={idx}
                src={current.src}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
                onEnded={advance}
              />
            )}
          </div>

          {/* Centered Thank You text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2 px-4">
            <p
              className="font-black uppercase tracking-[0.25em] text-center"
              style={{
                color: "#d4af37",
                fontSize: "clamp(2.5rem, 10vw, 5rem)",
                textShadow: "0 2px 20px rgba(0,0,0,0.9), 0 0 40px rgba(212,175,55,0.3)",
                animation: "champShimmer 2.5s ease-in-out infinite",
              }}
            >
              {t("u11ThankYouBadge")}
            </p>
            {/* Video clip label */}
            {current.type === "video" && (
              <span
                className="text-white/80 text-sm font-bold px-3 py-1 rounded-full"
                style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
              >
                {current.label}
              </span>
            )}
          </div>

          {/* Mute toggle — always visible for music + video */}
          <button
            onClick={toggleMute}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95"
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.8)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span>{muted ? "🔇" : "🔊"}</span>
            <span>{muted ? "Tap to unmute" : "Mute"}</span>
          </button>

          {/* Progress dots */}
          <div className="absolute bottom-10 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
            {MEDIA.map((item, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: item.type === "video" ? "10px" : "6px",
                  height: "6px",
                  background: i === idx ? "rgba(212,175,55,0.95)" : "rgba(255,255,255,0.3)",
                  transform: i === idx ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>

          {/* Skip */}
          <button
            onClick={skip}
            className="absolute bottom-8 right-6 px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-colors"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
          >
            Skip →
          </button>
        </>
      )}

      {/* ── Thank You card ── */}
      {phase === "card" && (
        <div
          className="absolute inset-0 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.92)", animation: "champFadeIn 0.4s ease-out both" }}
          onClick={close}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-[500px] h-[500px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)" }}
            />
          </div>

          <div
            className="relative z-10 w-full max-w-[400px] bg-[#1c1c1e] rounded-3xl overflow-hidden border border-[#d4af37]/30"
            style={{
              animation: "champPopIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
              boxShadow: "0 0 60px rgba(212,175,55,0.15), 0 30px 70px rgba(0,0,0,0.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#f5cc5c]" />

            <div className="px-6 pt-8 pb-7 text-center">
              <div className="mb-4" style={{ animation: "champFloat 3s ease-in-out infinite" }}>
                <Image
                  src="/logo.jpg"
                  alt="North Legends FC"
                  width={80}
                  height={80}
                  className="rounded-full border-2 border-[#d4af37]/60 mx-auto"
                  style={{ boxShadow: "0 0 24px rgba(212,175,55,0.3)" }}
                />
              </div>

              <p
                className="text-[#d4af37] text-[9px] font-black uppercase tracking-[0.35em] mb-3"
                style={{ animation: "champShimmer 2.5s ease-in-out infinite" }}
              >
                {t("u11ThankYouBadge")}
              </p>

              <h2 className="text-white text-[30px] font-black tracking-tight mb-3 leading-tight">
                {t("u11ThankYouHeadline")}
              </h2>

              <p className="text-white/60 text-sm leading-relaxed mb-5 max-w-[280px] mx-auto">
                {t("u11ThankYouBody")}
              </p>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[#d4af37]/20" />
                <span className="text-[#d4af37] text-[9px] uppercase tracking-widest">{t("seasonRecord")}</span>
                <div className="flex-1 h-px bg-[#d4af37]/20" />
              </div>

              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <div className="bg-green-500/10 rounded-2xl py-3 border border-green-500/20">
                  <p className="text-green-400 text-3xl font-black">{wins}</p>
                  <p className="text-green-400/60 text-[9px] uppercase tracking-wide mt-0.5">{t("wins")}</p>
                </div>
                <div className="bg-yellow-500/10 rounded-2xl py-3 border border-yellow-500/20">
                  <p className="text-yellow-400 text-3xl font-black">{draws}</p>
                  <p className="text-yellow-400/60 text-[9px] uppercase tracking-wide mt-0.5">{t("draws")}</p>
                </div>
                <div className="bg-red-500/10 rounded-2xl py-3 border border-red-500/20">
                  <p className="text-red-400 text-3xl font-black">{losses}</p>
                  <p className="text-red-400/60 text-[9px] uppercase tracking-wide mt-0.5">{t("losses")}</p>
                </div>
              </div>

              <button
                onClick={close}
                className="w-full py-4 rounded-2xl font-black text-lg text-[#1c1c1e] tracking-wide hover:opacity-90 active:opacity-80 transition-opacity"
                style={{ background: "linear-gradient(135deg, #b8860b, #d4af37 50%, #f5cc5c)" }}
              >
                {t("u11ThankYouCta")}
              </button>
            </div>

            <div className="h-1.5 bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#f5cc5c]" />
          </div>
        </div>
      )}
    </div>
  );
}
