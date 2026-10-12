"use client";

import { useEffect, useRef } from "react";
import { track } from "@vercel/analytics";

export default function ScrollDepthTracker({ page }: { page: string }) {
  const fired = useRef(new Set<number>());

  useEffect(() => {
    fired.current.clear();

    const checkDepth = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const pct = Math.round((scrolled / total) * 100);

      for (const milestone of [25, 50, 75, 100]) {
        if (pct >= milestone && !fired.current.has(milestone)) {
          fired.current.add(milestone);
          track("scroll_depth", { page, depth: milestone });
        }
      }
    };

    window.addEventListener("scroll", checkDepth, { passive: true });
    checkDepth();
    return () => window.removeEventListener("scroll", checkDepth);
  }, [page]);

  return null;
}
