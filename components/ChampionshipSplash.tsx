"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import ChampionshipCountdown from "./ChampionshipCountdown";

const VERSION = "fall-2024-v2";

const VIDEOS = {
  goal: {
    desktop: "https://pub-ec6efd6486724c999de33694e15dd4dc.r2.dev/championship-goal.mp4",
    mobile:  "https://pub-ec6efd6486724c999de33694e15dd4dc.r2.dev/championship-goal.mp4",
  },
  reel: {
    desktop: "https://pub-ec6efd6486724c999de33694e15dd4dc.r2.dev/championship-squad-reel-web.mp4",
    mobile:  "https://pub-ec6efd6486724c999de33694e15dd4dc.r2.dev/championship-squad-reel-mobile.mp4",
  },
};

interface Props {
  wins: number;
  losses: number;
  draws: number;
  rank: number | null;
  team: string;
  splashVideo?: "goal" | "reel";
}

function rankLabel(rank: number | null): string {
  if (rank === 1) return "★ #1 · Table Leaders";
  if (rank === 2) return "#2 · Fighting for the Top";
  if (rank !== null) return `#${rank} in the Table`;
  return "Fall Championship";
}

const PARTICLES = [
  { left: "8%",  delay: "0s",    dur: "4s",   icon: "🍂" },
  { left: "22%", delay: "0.6s",  dur: "3.5s", icon: "⭐" },
  { left: "40%", delay: "1.1s",  dur: "4.5s", icon: "🍂" },
  { left: "58%", delay: "0.3s",  dur: "3.8s", icon: "⭐" },
  { left: "74%", delay: "0.9s",  dur: "4.2s", icon: "🍂" },
  { left: "89%", delay: "0.15s", dur: "3.3s", icon: "⭐" },
];

type Phase = "video" | "flash" | "card" | "gone";

export default function ChampionshipSplash({ wins, losses, draws, rank, team, splashVideo = "goal" }: Props) {
  const VIDEO_DESKTOP = VIDEOS[splashVideo].desktop;
  const VIDEO_MOBILE  = VIDEOS[splashVideo].mobile;
  const t = useTranslations("Championship");
  const [phase, setPhase] = useState<Phase>("gone");
  const [muted, setMuted] = useState(true);
  const [isPortrait, setIsPortrait] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStartRef = useRef<number>(0);
  const key = `champ_splash_${VERSION}_${team}`;

  useEffect(() => {
    function check() { setIsPortrait(window.innerHeight > window.innerWidth); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function enterFullscreen() {
    const el = videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    // iOS Safari
    else if ((el as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen)
      (el as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
  }

  useEffect(() => {
    if (!sessionStorage.getItem(key)) {
      const timer = setTimeout(() => {
        videoStartRef.current = Date.now();
        setPhase("video");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [key]);

  useEffect(() => {
    function replay() {
      videoStartRef.current = Date.now();
      setMuted(true);
      if (videoRef.current) videoRef.current.muted = true;
      setPhase("video");
    }
    window.addEventListener("watch-champ-intro", replay);
    return () => window.removeEventListener("watch-champ-intro", replay);
  }, []);

  function goToCard() {
    const elapsed = Date.now() - videoStartRef.current;
    const remaining = Math.max(0, 4000 - elapsed);
    setTimeout(() => {
      setPhase("flash");
      setTimeout(() => setPhase("card"), 400);
    }, remaining);
  }

  function close() {
    sessionStorage.setItem(key, "seen");
    setPhase("gone");
  }

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  }

  if (phase === "gone") return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black">

      {/* ── Phase 1: Full-screen video ── */}
      {(phase === "video" || phase === "flash") && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: phase === "flash" ? 0 : 1 }}
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            onEnded={goToCard}
          >
            <source src={VIDEO_MOBILE}  media="(max-width: 767px)" type="video/mp4" />
            <source src={VIDEO_DESKTOP} type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

          <div className="absolute top-6 inset-x-0 flex flex-col items-center gap-2 pointer-events-none">
            <div
              className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em]"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(212,175,55,0.5)",
                color: "#d4af37",
                backdropFilter: "blur(8px)",
              }}
            >
              {t("badge")} · {t("year")}
            </div>

            {/* Portrait rotate hint — mobile only */}
            {isPortrait && (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold pointer-events-auto"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span style={{ display: "inline-block", transform: "rotate(90deg)" }}>📱</span>
                <span>Rotate for best experience</span>
                <button
                  onClick={enterFullscreen}
                  className="ml-1 font-bold"
                  style={{ color: "#d4af37" }}
                >
                  or go fullscreen ⛶
                </button>
              </div>
            )}
          </div>

          {/* Centered unmute pill */}
          <div className="absolute bottom-20 inset-x-0 flex justify-center">
            <button
              onClick={toggleMute}
              className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all active:scale-95"
              style={{
                background: muted ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.2)",
                border: muted ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
                color: muted ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
                backdropFilter: "blur(12px)",
                transition: "all 0.3s ease",
              }}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              <span className="text-base">{muted ? "🔇" : "🔊"}</span>
              <span>{muted ? "Tap to unmute" : "Mute"}</span>
            </button>
          </div>

          <div className="absolute bottom-8 right-6 flex items-center gap-2">
            <button
              onClick={enterFullscreen}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-colors"
              style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
              aria-label="Fullscreen"
            >
              ⛶
            </button>
            <button
              onClick={goToCard}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-colors"
              style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
            >
              Skip →
            </button>
          </div>
        </div>
      )}

      {/* ── Gold flash ── */}
      {phase === "flash" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "rgba(212,175,55,0.35)", animation: "champFadeIn 0.4s ease-out both" }}
        />
      )}

      {/* ── Phase 2: Card ── */}
      {phase === "card" && (
        <div
          className="absolute inset-0 flex items-center justify-center px-4"
          style={{ animation: "champFadeIn 0.3s ease-out both" }}
          onClick={close}
        >
          <div className="absolute inset-0 bg-black/88 backdrop-blur-sm" />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[480px] h-[480px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)" }} />
          </div>

          {PARTICLES.map((p, i) => (
            <div key={i} className="absolute top-0 pointer-events-none select-none text-lg"
              style={{ left: p.left, animation: `champFall ${p.dur} ${p.delay} ease-in infinite` }}>
              {p.icon}
            </div>
          ))}

          <div
            className="relative z-10 w-full max-w-[400px] bg-[#1c1c1e] rounded-3xl overflow-hidden border border-[#d4af37]/30"
            style={{
              animation: "champPopIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
              boxShadow: "0 0 60px rgba(212,175,55,0.22), 0 30px 70px rgba(0,0,0,0.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#f5cc5c]" />

            <div className="px-6 pt-8 pb-7 text-center">
              <div className="mb-3" style={{ animation: "champFloat 3s ease-in-out infinite" }}>
                <Image
                  src="/logo.jpg"
                  alt="North Legends FC"
                  width={96}
                  height={96}
                  className="rounded-full border-2 border-[#d4af37]/60 mx-auto"
                  style={{ boxShadow: "0 0 24px rgba(212,175,55,0.3)" }}
                />
              </div>

              <p className="text-[#d4af37] text-[9px] font-black uppercase tracking-[0.3em] mb-0.5"
                style={{ animation: "champShimmer 2.5s ease-in-out infinite" }}>
                {t("badge")}
              </p>
              <p className="text-[#d4af37] text-[9px] uppercase tracking-widest mb-5">{t("year")}</p>

              <h2 className="text-[#c8102e] text-[29px] font-black tracking-tight mb-3">North Legends FC</h2>

              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full mb-5"
                style={{
                  background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))",
                  border: "1px solid rgba(212,175,55,0.4)",
                }}>
                <span className="text-[#d4af37] text-[9px] font-black tracking-wide">{rankLabel(rank)}</span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[#d4af37]/20" />
                <span className="text-[#d4af37] text-[9px] uppercase tracking-widest">{t("seasonRecord")}</span>
                <div className="flex-1 h-px bg-[#d4af37]/20" />
              </div>

              <div className="grid grid-cols-3 gap-2.5 mb-5">
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

              <div className="mb-6">
                <ChampionshipCountdown compact />
              </div>

              <button
                onClick={close}
                className="w-full py-4 rounded-2xl font-black text-lg text-[#1c1c1e] tracking-wide hover:opacity-90 active:opacity-80 transition-opacity"
                style={{ background: "linear-gradient(135deg, #b8860b, #d4af37 50%, #f5cc5c)" }}
              >
                {t("cta")}
              </button>

              <div className="mt-3 flex items-center justify-center gap-4">
                <button
                  onClick={() => { videoStartRef.current = Date.now(); setPhase("video"); }}
                  className="text-[#d4af37]/50 text-sm font-bold hover:text-[#d4af37] transition-colors"
                >
                  ▶ {t("watchAgain")}
                </button>
                <span className="text-[#d4af37]/20 text-sm">·</span>
                <button onClick={close} className="text-[#d4af37]/50 text-sm font-bold hover:text-[#d4af37] transition-colors">
                  {t("dismiss")}
                </button>
              </div>
            </div>

            <div className="h-1.5 bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#f5cc5c]" />

            {/* Sponsors strip */}
            <div className="px-6 py-3 flex items-center justify-center gap-5"
              style={{ background: "#161616", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 9, fontWeight: 700, color: "#d4af37",
                textTransform: "uppercase", letterSpacing: "0.2em", whiteSpace: "nowrap",
              }}>
                Supported by
              </span>
              <Image
                src="/sponsors/houk-logo.svg"
                alt="Houk AC"
                width={74}
                height={20}
                className="opacity-70"
              />
              <Image
                src="/sponsors/bonillas-logo.png"
                alt="Bonilla's Painting"
                width={69}
                height={21}
                className="opacity-60"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
