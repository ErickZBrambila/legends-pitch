"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Platform = "ios" | "android";

const IOS_ICONS = ["🌐", "⬆️", "🏠", "📱", "🔔"];
const ANDROID_ICONS = ["🌐", "⋮", "🏠", "📱", "🔔"];
const STEP_COUNT = 5;

export default function PushTutorialModal({ open, onClose }: Props) {
  const t = useTranslations("PushTutorial");
  const [platform, setPlatform] = useState<Platform>("ios");

  if (!open) return null;

  const icons = platform === "ios" ? IOS_ICONS : ANDROID_ICONS;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 sm:px-0"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-[#1c1c2e] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-white/10 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-black text-lg">{t("title")}</h2>
            <p className="text-white/40 text-xs mt-0.5">{t("subtitle")}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 text-2xl leading-none px-1">×</button>
        </div>

        {/* Platform toggle */}
        <div className="flex gap-2 px-5 pt-4">
          {(["ios", "android"] as Platform[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                platform === p
                  ? "bg-[var(--color-accent)] text-[var(--color-navy)]"
                  : "bg-white/10 text-white/60 hover:bg-white/15"
              }`}
            >
              {t(`${p}Tab`)}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div className="px-5 py-4 flex flex-col gap-3 max-h-[55vh] overflow-y-auto">
          {Array.from({ length: STEP_COUNT }, (_, i) => i + 1).map((n) => (
            <div key={n} className="flex gap-3 items-start">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-base">
                {icons[n - 1]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-[var(--color-accent)] bg-[var(--color-accent)]/10 rounded-full px-1.5 py-0.5">
                    {n}
                  </span>
                  <p className="text-white text-sm font-bold">{t(`${platform}_${n}_title`)}</p>
                </div>
                <p className="text-white/50 text-xs mt-1 leading-relaxed">{t(`${platform}_${n}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="px-5 pb-5 pt-2 border-t border-white/10">
          <p className="text-white/30 text-xs text-center leading-relaxed">
            {t(`${platform}Note`)}
          </p>
        </div>
      </div>
    </div>
  );
}
