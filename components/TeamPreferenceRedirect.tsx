"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredPrefs } from "@/components/LanguagePickerModal";

export default function TeamPreferenceRedirect({ currentTeam }: { currentTeam: string }) {
  const router = useRouter();

  useEffect(() => {
    const prefs = getStoredPrefs();
    if (prefs && prefs.team !== currentTeam) {
      // URL has no explicit team param — redirect to stored preference
      router.replace(`/schedule?team=${prefs.team}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
