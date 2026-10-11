"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE } from "@/i18n/routing";

const STORAGE_KEY = "nl-lang-chosen";

export default function LanguagePickerModal() {
  const [visible, setVisible] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const pick = (locale: "en" | "es") => {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000`;
    localStorage.setItem(STORAGE_KEY, locale);
    setVisible(false);
    startTransition(() => router.refresh());
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
        {/* Logo */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[var(--color-accent)] shadow-lg mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="North Legends FC" className="w-full h-full object-cover" />
        </div>

        <h2 className="text-xl font-black text-[var(--color-navy)] mb-1">North Legends FC</h2>

        {/* Bilingual prompt */}
        <p className="text-sm text-gray-500 mb-1">Choose your language</p>
        <p className="text-sm text-gray-400 mb-7">Elige tu idioma</p>

        <div className="flex gap-4 w-full">
          <button
            onClick={() => pick("en")}
            className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 border-gray-200 hover:border-[var(--color-accent)] hover:bg-amber-50 transition-all group"
          >
            <span className="text-2xl">🇺🇸</span>
            <span className="font-bold text-[var(--color-navy)] text-sm group-hover:text-[var(--color-accent)] transition-colors">
              English
            </span>
          </button>

          <button
            onClick={() => pick("es")}
            className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 border-gray-200 hover:border-[var(--color-accent)] hover:bg-amber-50 transition-all group"
          >
            <span className="text-2xl">🇲🇽</span>
            <span className="font-bold text-[var(--color-navy)] text-sm group-hover:text-[var(--color-accent)] transition-colors">
              Español
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
