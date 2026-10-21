"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE } from "@/i18n/routing";

// Bump this key to force everyone to re-pick (resets all stored prefs).
export const PREFS_KEY = "nl-prefs-v2";

export interface UserPrefs {
  locale: "en" | "es";
  team: "u11" | "u12";
}

export function getStoredPrefs(): UserPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as UserPrefs) : null;
  } catch {
    return null;
  }
}

export default function LanguagePickerModal() {
  const [visible, setVisible] = useState(false);
  const [locale, setLocale] = useState<"en" | "es" | null>(null);
  const [team, setTeam] = useState<"u11" | "u12" | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem(PREFS_KEY)) {
      setVisible(true);
    }
  }, []);

  const canConfirm = locale !== null && team !== null;

  const confirm = () => {
    if (!locale || !team) return;
    const prefs: UserPrefs = { locale, team };
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
    setVisible(false);
    startTransition(() => {
      // Redirect to the team's schedule so the preference takes effect immediately
      router.push(`/schedule?team=${team}`);
      router.refresh();
    });
  };

  if (!visible) return null;

  const sel = "border-[var(--color-accent)] bg-amber-50 ring-2 ring-[var(--color-accent)]/30";
  const unsel = "border-gray-200 hover:border-[var(--color-accent)] hover:bg-amber-50/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
        {/* Logo */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[var(--color-accent)] shadow-lg mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="North Legends FC" className="w-full h-full object-cover" />
        </div>

        <h2 className="text-xl font-black text-[var(--color-navy)] mb-1">North Legends FC</h2>

        {/* Language */}
        <p className="text-sm text-gray-500 mt-4 mb-1">Choose your language</p>
        <p className="text-xs text-gray-400 mb-3">Elige tu idioma</p>

        <div className="flex gap-3 w-full mb-6">
          <button
            onClick={() => setLocale("en")}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 transition-all ${locale === "en" ? sel : unsel}`}
          >
            <span className="text-2xl">🇺🇸</span>
            <span className="font-bold text-[var(--color-navy)] text-sm">English</span>
          </button>
          <button
            onClick={() => setLocale("es")}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 transition-all ${locale === "es" ? sel : unsel}`}
          >
            <span className="text-2xl">🇲🇽</span>
            <span className="font-bold text-[var(--color-navy)] text-sm">Español</span>
          </button>
        </div>

        {/* Team */}
        <p className="text-sm text-gray-500 mb-1">Your team</p>
        <p className="text-xs text-gray-400 mb-3">Tu equipo</p>

        <div className="flex gap-3 w-full mb-7">
          <button
            onClick={() => setTeam("u11")}
            className={`flex-1 flex flex-col items-center gap-1 py-3.5 rounded-xl border-2 transition-all ${team === "u11" ? sel : unsel}`}
          >
            <span className="text-2xl font-black text-[var(--color-navy)]">U11</span>
            <span className="text-xs text-gray-500">2015 · 2016</span>
          </button>
          <button
            onClick={() => setTeam("u12")}
            className={`flex-1 flex flex-col items-center gap-1 py-3.5 rounded-xl border-2 transition-all ${team === "u12" ? sel : unsel}`}
          >
            <span className="text-2xl font-black text-[var(--color-navy)]">U12</span>
            <span className="text-xs text-gray-500">2014 · 2015</span>
          </button>
        </div>

        <button
          onClick={confirm}
          disabled={!canConfirm}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all bg-[var(--color-navy)] text-[var(--color-accent)] disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
        >
          {locale === "es" ? "Comenzar ⚽" : "Let's go ⚽"}
        </button>
      </div>
    </div>
  );
}
