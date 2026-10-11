"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, LOCALE_COOKIE, type Locale } from "@/i18n/routing";

export default function LanguageSwitcher({
  className = "",
}: {
  className?: string;
}) {
  const t = useTranslations("LanguageSwitcher");
  const activeLocale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setLocale(next: Locale) {
    if (next === activeLocale) return;
    // Persist the choice for ~1 year; no URL prefix is used.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border border-white/20 overflow-hidden ${className}`}
      role="group"
      aria-label={t("label")}
    >
      {locales.map((loc) => {
        const active = loc === activeLocale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => setLocale(loc)}
            disabled={isPending}
            aria-pressed={active}
            aria-label={loc === "en" ? t("switchToEnglish") : t("switchToSpanish")}
            className={`px-2.5 py-1 text-xs font-bold tracking-wide transition-colors disabled:opacity-60 ${
              active
                ? "bg-[var(--color-accent)] text-[#1c1c1e]"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {t(loc)}
          </button>
        );
      })}
    </div>
  );
}
