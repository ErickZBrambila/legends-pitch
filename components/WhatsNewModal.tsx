"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

// Bump this version string when you want to re-show the modal to returning users
const VERSION = "2026-10-v3";
const STORAGE_KEY = `nlfc_whats_new_${VERSION}`;

const FEATURE_KEYS = ["search", "photos", "push"] as const;
const FEATURE_ICONS = { search: "🔍", photos: "📷", push: "⚽" };

export default function WhatsNewModal() {
  const t = useTranslations("WhatsNew");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTimeout(() => setOpen(true), 800);
    }
  }, []);

  function close() {
    localStorage.setItem(STORAGE_KEY, "seen");
    setOpen(false);
  }

  if (!open) return null;

  const key = FEATURE_KEYS[step];
  const isLast = step === FEATURE_KEYS.length - 1;

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center px-4 sm:px-0" onClick={close}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-[#1c1c2e] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-white/10 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge */}
        <div className="flex justify-center pt-5 pb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1 rounded-full">
            {t("badge")}
          </span>
        </div>

        {/* Feature card */}
        <div className="px-6 pb-4 text-center min-h-[160px] flex flex-col items-center justify-center">
          <div className="text-5xl mb-4">{FEATURE_ICONS[key]}</div>
          <h2 className="text-white font-black text-xl mb-2">{t(`${key}_title`)}</h2>
          <p className="text-white/50 text-sm leading-relaxed">{t(`${key}_desc`)}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {FEATURE_KEYS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "bg-[var(--color-accent)] w-4" : "bg-white/20 w-1.5"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={close}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 hover:text-white/60 border border-white/10 transition-colors"
          >
            {t("skip")}
          </button>
          <button
            onClick={() => isLast ? close() : setStep((s) => s + 1)}
            className="flex-1 py-3 rounded-xl text-sm font-black bg-[var(--color-accent)] text-[var(--color-navy)] active:opacity-80 transition-opacity"
          >
            {isLast ? t("gotIt") : t("next")}
          </button>
        </div>
      </div>
    </div>
  );
}
