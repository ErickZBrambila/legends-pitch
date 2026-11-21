"use client";

import { useTranslations } from "next-intl";

export default function WatchU11Button() {
  const t = useTranslations("Championship");
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("watch-u11-thankyou"))}
      className="text-[var(--color-accent)] text-xs uppercase tracking-widest font-semibold hover:opacity-70 transition-opacity"
    >
      ▶ {t("watchAgain")}
    </button>
  );
}
