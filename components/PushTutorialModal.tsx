"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Platform = "ios" | "android";

const IOS_STEPS = [
  { icon: "🌐", title: "Open in Safari", desc: "Push notifications only work through Safari on iPhone/iPad. Make sure you're using Safari, not Chrome or Firefox." },
  { icon: "⬆️", title: "Tap the Share button", desc: 'Tap the Share icon at the bottom of the screen (the box with an arrow pointing up).' },
  { icon: "🏠", title: "Add to Home Screen", desc: 'Scroll down in the share sheet and tap "Add to Home Screen", then tap "Add" in the top right.' },
  { icon: "📱", title: "Open the app", desc: "Find the North Legends FC icon on your home screen and open it from there — not from Safari." },
  { icon: "🔔", title: "Enable notifications", desc: 'Tap "Enable" on the notification banner that appears, or go to the bell icon in the menu and allow notifications.' },
];

const ANDROID_STEPS = [
  { icon: "🌐", title: "Open in Chrome", desc: "Push notifications work best through Chrome on Android. Make sure you're using Chrome." },
  { icon: "⋮", title: "Tap the menu", desc: "Tap the three-dot menu (⋮) in the top-right corner of Chrome." },
  { icon: "🏠", title: "Add to Home Screen", desc: 'Tap "Add to Home Screen" or "Install App". A shortcut will appear on your home screen.' },
  { icon: "📱", title: "Open the app", desc: "Open North Legends FC from your home screen — it will open as a full-screen app." },
  { icon: "🔔", title: "Allow notifications", desc: 'Tap "Allow" when the browser asks for notification permission. Done!' },
];

export default function PushTutorialModal({ open, onClose }: Props) {
  const [platform, setPlatform] = useState<Platform>("ios");

  if (!open) return null;

  const steps = platform === "ios" ? IOS_STEPS : ANDROID_STEPS;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 sm:px-0"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-[#1c1c2e] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-white/10 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-black text-lg">Get Game Notifications</h2>
            <p className="text-white/40 text-xs mt-0.5">Stay updated on game times, scores & announcements</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 text-2xl leading-none px-1">×</button>
        </div>

        {/* Platform toggle */}
        <div className="flex gap-2 px-5 pt-4">
          <button
            onClick={() => setPlatform("ios")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
              platform === "ios"
                ? "bg-[var(--color-accent)] text-[var(--color-navy)]"
                : "bg-white/10 text-white/60 hover:bg-white/15"
            }`}
          >
             iPhone / iPad
          </button>
          <button
            onClick={() => setPlatform("android")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
              platform === "android"
                ? "bg-[var(--color-accent)] text-[var(--color-navy)]"
                : "bg-white/10 text-white/60 hover:bg-white/15"
            }`}
          >
            🤖 Android
          </button>
        </div>

        {/* Steps */}
        <div className="px-5 py-4 flex flex-col gap-3 max-h-[55vh] overflow-y-auto">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-base">
                {step.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-[var(--color-accent)] bg-[var(--color-accent)]/10 rounded-full px-1.5 py-0.5">
                    {i + 1}
                  </span>
                  <p className="text-white text-sm font-bold">{step.title}</p>
                </div>
                <p className="text-white/50 text-xs mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="px-5 pb-5 pt-2 border-t border-white/10">
          <p className="text-white/30 text-xs text-center leading-relaxed">
            {platform === "ios"
              ? "iOS requires the app to be installed to your Home Screen before notifications work."
              : "Android supports notifications both from the browser and after adding to Home Screen."}
          </p>
        </div>
      </div>
    </div>
  );
}
