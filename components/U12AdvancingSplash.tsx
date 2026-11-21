"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

const KEY = "u12_advancing_v1";
const BRACKET_URL = "/championship/stx";

const PARTICLES = [
  { left: "5%",  delay: "0s",    dur: "3.5s", icon: "⭐" },
  { left: "18%", delay: "0.4s",  dur: "4s",   icon: "🏆" },
  { left: "32%", delay: "0.8s",  dur: "3.8s", icon: "⭐" },
  { left: "50%", delay: "0.2s",  dur: "4.2s", icon: "🌟" },
  { left: "68%", delay: "0.6s",  dur: "3.6s", icon: "⭐" },
  { left: "82%", delay: "1s",    dur: "4.4s", icon: "🏆" },
  { left: "92%", delay: "0.3s",  dur: "3.3s", icon: "⭐" },
];

interface Props {
  wins: number;
  losses: number;
  draws: number;
}

export default function U12AdvancingSplash({ wins, losses, draws }: Props) {
  const t = useTranslations("Championship");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) {
      const timer = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    function replay() { setVisible(true); }
    window.addEventListener("watch-u12-advancing", replay);
    return () => window.removeEventListener("watch-u12-advancing", replay);
  }, []);

  function close() {
    localStorage.setItem(KEY, "seen");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(5,10,30,0.96)", animation: "champFadeIn 0.4s ease-out both" }}
      onClick={close}
    >
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div
          className="w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.14) 0%, rgba(191,10,48,0.06) 45%, transparent 70%)",
          }}
        />
      </div>

      {/* Falling particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute top-0 pointer-events-none select-none text-xl"
          style={{ left: p.left, animation: `champFall ${p.dur} ${p.delay} ease-in infinite` }}
        >
          {p.icon}
        </div>
      ))}

      <div
        className="relative z-10 w-full max-w-[420px] bg-[#0d1b3e] rounded-3xl overflow-hidden"
        style={{
          animation: "champPopIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
          border: "1px solid rgba(212,175,55,0.4)",
          boxShadow: "0 0 80px rgba(212,175,55,0.2), 0 30px 70px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Texas-flag accent stripe */}
        <div className="flex h-2">
          <div className="w-6 bg-[#002868]" />
          <div className="flex-1 bg-[#bf0a30]" />
          <div className="flex-1 bg-white" />
        </div>

        <div className="px-6 pt-8 pb-7 text-center">
          <div className="mb-4" style={{ animation: "champFloat 3s ease-in-out infinite" }}>
            <Image
              src="/logo.jpg"
              alt="North Legends FC"
              width={80}
              height={80}
              className="rounded-full border-2 border-[#d4af37]/60 mx-auto"
              style={{ boxShadow: "0 0 28px rgba(212,175,55,0.4)" }}
            />
          </div>

          <p
            className="text-[#d4af37] text-[9px] font-black uppercase tracking-[0.35em] mb-2"
            style={{ animation: "champShimmer 2.5s ease-in-out infinite" }}
          >
            {t("u12AdvancingBadge")}
          </p>

          <h2 className="text-white text-[26px] font-black tracking-tight mb-1 leading-tight">
            {t("u12AdvancingHeadline")}
          </h2>

          <p className="text-[#d4af37] text-xs font-bold mb-5 uppercase tracking-[0.2em]">
            {t("u12AdvancingTournament")}
          </p>

          <p className="text-white/60 text-sm leading-relaxed mb-5 max-w-[280px] mx-auto">
            {t("u12AdvancingBody")}
          </p>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#d4af37]/20" />
            <span className="text-[#d4af37] text-[9px] uppercase tracking-widest">{t("seasonRecord")}</span>
            <div className="flex-1 h-px bg-[#d4af37]/20" />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            <div
              className="rounded-2xl py-3"
              style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}
            >
              <p className="text-green-400 text-3xl font-black">{wins}</p>
              <p className="text-green-400/60 text-[9px] uppercase tracking-wide mt-0.5">{t("wins")}</p>
            </div>
            <div
              className="rounded-2xl py-3"
              style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.2)" }}
            >
              <p className="text-yellow-400 text-3xl font-black">{draws}</p>
              <p className="text-yellow-400/60 text-[9px] uppercase tracking-wide mt-0.5">{t("draws")}</p>
            </div>
            <div
              className="rounded-2xl py-3"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}
            >
              <p className="text-red-400 text-3xl font-black">{losses}</p>
              <p className="text-red-400/60 text-[9px] uppercase tracking-wide mt-0.5">{t("losses")}</p>
            </div>
          </div>

          <a
            href={BRACKET_URL}
            onClick={close}
            className="block w-full py-4 rounded-2xl font-black text-base text-[#0d1b3e] tracking-wide hover:opacity-90 active:opacity-80 transition-opacity mb-3"
            style={{ background: "linear-gradient(135deg, #b8860b, #d4af37 50%, #f5cc5c)" }}
          >
            {t("u12AdvancingCta")}
          </a>

          <button
            onClick={close}
            className="text-white/40 text-sm font-bold hover:text-white/70 transition-colors"
          >
            {t("u12AdvancingDismiss")}
          </button>
        </div>

        {/* Texas-flag stripe bottom */}
        <div className="flex h-2">
          <div className="w-6 bg-[#002868]" />
          <div className="flex-1 bg-[#bf0a30]" />
          <div className="flex-1 bg-white" />
        </div>
      </div>
    </div>
  );
}
