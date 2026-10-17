"use client";

import { useEffect, useState } from "react";

// Bump this version string when you want to re-show the modal to returning users
const VERSION = "2026-10-v2";
const STORAGE_KEY = `nlfc_whats_new_${VERSION}`;

const FEATURES = [
  {
    icon: "🔍",
    title: "Search anything",
    desc: "Press ⌘K (or tap the search icon in the menu) to instantly find players, games, news, and pages. Try searching for an opponent name or a player number.",
  },
  {
    icon: "📷",
    title: "Player photos",
    desc: "Parents can now submit a photo for their player directly from the Roster page. Tap “Add photo” on your player’s card — it goes to Coach Hugo for approval.",
  },
  {
    icon: "⚽",
    title: "Game-day push reminders",
    desc: "If you have the app on your Home Screen with notifications enabled, you'll get an automatic reminder at noon on every game day — no more missing kickoff times.",
  },
];

export default function WhatsNewModal() {
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

  const feature = FEATURES[step];
  const isLast = step === FEATURES.length - 1;

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
            What&apos;s New
          </span>
        </div>

        {/* Feature card */}
        <div className="px-6 pb-4 text-center min-h-[160px] flex flex-col items-center justify-center">
          <div className="text-5xl mb-4">{feature.icon}</div>
          <h2 className="text-white font-black text-xl mb-2">{feature.title}</h2>
          <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {FEATURES.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === step ? "bg-[var(--color-accent)] w-4" : "bg-white/20"
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
            Skip
          </button>
          <button
            onClick={() => isLast ? close() : setStep((s) => s + 1)}
            className="flex-1 py-3 rounded-xl text-sm font-black bg-[var(--color-accent)] text-[var(--color-navy)] active:opacity-80 transition-opacity"
          >
            {isLast ? "Got it!" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
