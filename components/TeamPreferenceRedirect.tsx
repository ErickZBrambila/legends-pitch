"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getStoredPrefs } from "@/components/LanguagePickerModal";

// Pages that support a ?team= param — apply stored preference to these.
const TEAM_PAGES = ["/", "/schedule", "/roster", "/news", "/announcements", "/gallery", "/contact", "/highlights", "/videos"];

export default function TeamPreferenceRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const prefs = getStoredPrefs();
    if (!prefs) return;
    if (!TEAM_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return;
    if (searchParams.has("team")) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("team", prefs.team);
    router.replace(`${pathname}?${params.toString()}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
