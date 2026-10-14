"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "nlfc_push_dismissed";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

type State = "idle" | "subscribing" | "granted" | "denied" | "dismissed";

export default function PushPermission() {
  const [state, setState] = useState<State>("idle");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // iOS requires standalone mode for push
    if (isIos() && !isStandalone()) return;

    const perm = Notification.permission;

    // Always re-subscribe when permission is already granted — pushManager.subscribe()
    // is idempotent and this ensures the subscription is saved even if Redis was
    // unavailable when the user first granted permission.
    if (perm === "granted") {
      ensureSubscribed();
      return;
    }

    if (perm === "denied") return;

    // Only show the banner if the user hasn't dismissed it before
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureSubscribed() {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
    } catch {
      // Non-fatal — subscription failed silently
    }
  }

  async function handleEnable() {
    setState("subscribing");
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        await ensureSubscribed();
        setState("granted");
        setVisible(false);
        localStorage.setItem(STORAGE_KEY, "granted");
      } else {
        setState("denied");
        setVisible(false);
        localStorage.setItem(STORAGE_KEY, "denied");
      }
    } catch {
      setState("denied");
      setVisible(false);
    }
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "dismissed");
    setState("dismissed");
    setVisible(false);
  }

  if (!visible || state === "dismissed" || state === "granted") return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden">
      <div className="bg-[var(--color-navy)] border-t border-white/10 px-5 py-4 flex items-center gap-3 shadow-2xl">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-lg">
          🔔
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-tight">Stay in the loop</p>
          <p className="text-white/50 text-xs mt-0.5 leading-tight">
            Get notified about games, announcements & highlights
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={dismiss}
            className="text-white/40 hover:text-white/70 text-xs px-2 py-1"
          >
            No thanks
          </button>
          <button
            onClick={handleEnable}
            disabled={state === "subscribing"}
            className="bg-[var(--color-accent)] text-[var(--color-navy)] text-xs font-bold px-3 py-2 rounded-lg active:opacity-80 disabled:opacity-50"
          >
            {state === "subscribing" ? "…" : "Enable"}
          </button>
        </div>
      </div>
    </div>
  );
}
