"use client";

import { useTranslations } from "next-intl";

export default function ChampionshipWatchButton() {
  const t = useTranslations("Championship");

  function handleClick() {
    window.dispatchEvent(new CustomEvent("watch-champ-intro"));
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors hover:bg-white/10"
      style={{ borderColor: "rgba(212,175,55,0.4)", color: "#d4af37" }}
    >
      ▶ {t("watchIntro")}
    </button>
  );
}
