"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, type Locale } from "@/i18n/routing";

export default function AdminLangToggle({ locale }: { locale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="inline-flex items-center rounded-full border border-white/20 overflow-hidden">
      {(["en", "es"] as Locale[]).map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          disabled={isPending}
          className={`px-2.5 py-1 text-xs font-bold tracking-wide transition-colors disabled:opacity-60 ${
            loc === locale
              ? "bg-[var(--color-accent)] text-[#1c1c1e]"
              : "text-gray-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
