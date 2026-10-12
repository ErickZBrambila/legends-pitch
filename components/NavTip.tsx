"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "nlfc_nav_tip_dismissed";

export default function NavTip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="md:hidden bg-[var(--color-accent)] text-[var(--color-navy)] px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-semibold">
      <span className="flex items-center gap-2">
        <span className="text-base">☰</span>
        Tap the menu icon to explore all pages · Toca el menú para ver todo
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-lg leading-none opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
