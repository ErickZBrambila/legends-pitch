"use client";

import { useTranslations } from "next-intl";

export default function WatchIntroButton() {
  const t = useTranslations("Championship");
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("watch-champ-intro"))}
      className="text-[var(--color-accent)] text-xs uppercase tracking-widest font-semibold hover:opacity-70 transition-opacity"
    >
      ▶ {t("watchIntro")}
    </button>
  );
}
