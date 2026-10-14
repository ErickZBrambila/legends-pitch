"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "nlfc_a2hs_dismissed";

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return (
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export default function AddToHomeScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isIos() && !isInStandaloneMode() && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 md:hidden">
      {/* backdrop tap to dismiss */}
      <div className="absolute inset-x-0 bottom-full h-screen bg-black/30" onClick={dismiss} />

      <div className="relative bg-[var(--color-navy)] text-white rounded-t-2xl shadow-2xl px-5 pt-5 pb-8">
        {/* drag handle */}
        <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4" />

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-4 right-4 text-white/50 hover:text-white text-xl leading-none"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/apple-icon.png"
            alt="North Legends FC"
            className="w-12 h-12 rounded-xl"
          />
          <div>
            <p className="font-bold text-base leading-tight">North Legends FC</p>
            <p className="text-xs text-white/50">northlegendsfc.com</p>
          </div>
        </div>

        <p className="text-sm font-semibold mb-4 text-[var(--color-accent)]">
          Add to your Home Screen for the best experience
        </p>

        <ol className="space-y-3 text-sm text-white/80">
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent)] text-[var(--color-navy)] font-bold text-xs flex items-center justify-center mt-0.5">
              1
            </span>
            <span>
              Tap the{" "}
              <span className="inline-flex items-center gap-1 font-semibold text-white">
                {/* Safari share icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>{" "}
                Share
              </span>{" "}
              button in Safari&apos;s toolbar
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent)] text-[var(--color-navy)] font-bold text-xs flex items-center justify-center mt-0.5">
              2
            </span>
            <span>
              Scroll down and tap{" "}
              <span className="font-semibold text-white">&ldquo;Add to Home Screen&rdquo;</span>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent)] text-[var(--color-navy)] font-bold text-xs flex items-center justify-center mt-0.5">
              3
            </span>
            <span>
              Tap <span className="font-semibold text-white">&ldquo;Add&rdquo;</span> — done!
            </span>
          </li>
        </ol>

        <button
          onClick={dismiss}
          className="mt-6 w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-sm active:opacity-80"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
