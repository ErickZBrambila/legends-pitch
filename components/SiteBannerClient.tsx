"use client";

import { useEffect, useState } from "react";
import type { SiteBanner } from "@/lib/banner";

const styles: Record<SiteBanner["type"], { bar: string; icon: string }> = {
  maintenance: { bar: "bg-amber-400 text-amber-950", icon: "🔧" },
  incident:    { bar: "bg-red-600 text-white",        icon: "⚠️" },
  info:        { bar: "bg-blue-600 text-white",        icon: "ℹ️" },
};

export default function SiteBannerClient() {
  const [banner, setBanner] = useState<SiteBanner | null>(null);

  async function fetchBanner() {
    try {
      const res = await fetch("/api/admin/banner", { cache: "no-store" });
      const data = await res.json();
      setBanner(data.banner ?? null);
    } catch {}
  }

  useEffect(() => {
    fetchBanner();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") fetchBanner();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  if (!banner) return null;

  const { bar, icon } = styles[banner.type] ?? styles.info;
  return (
    <div className={`${bar} px-4 py-2.5 text-sm font-semibold text-center flex items-center justify-center gap-2`}>
      <span>{icon}</span>
      <span>{banner.message}</span>
    </div>
  );
}
