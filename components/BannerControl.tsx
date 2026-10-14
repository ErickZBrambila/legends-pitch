"use client";

import { useState } from "react";
import type { BannerType } from "@/lib/banner";

const TYPES: { value: BannerType; label: string; color: string }[] = [
  { value: "maintenance", label: "🔧 Maintenance", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { value: "incident",    label: "⚠️ Incident",    color: "bg-red-100 text-red-800 border-red-300" },
  { value: "info",        label: "ℹ️ Info",         color: "bg-blue-100 text-blue-800 border-blue-300" },
];

export default function BannerControl({ active }: { active: { message: string; type: BannerType } | null }) {
  const [currentActive, setCurrentActive] = useState(active);
  const [message, setMessage] = useState(active?.message ?? "");
  const [type, setType] = useState<BannerType>(active?.type ?? "maintenance");
  const [status, setStatus] = useState<"idle" | "saving" | "clearing" | "ok" | "error">("idle");
  const [sent, setSent] = useState<number | null>(null);

  async function post(body: object) {
    const res = await fetch("/api/admin/banner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = res.ok ? await res.json().catch(() => ({})) : {};
    return { ok: res.ok, sent: data.sent ?? null };
  }

  async function handlePost() {
    if (!message.trim()) return;
    setStatus("saving");
    const { ok, sent: s } = await post({ message, type });
    if (ok) setCurrentActive({ message, type });
    setSent(ok ? s : null);
    setStatus(ok ? "ok" : "error");
    setTimeout(() => setStatus("idle"), 3000);
  }

  async function handleClear() {
    setStatus("clearing");
    const { ok } = await post({ clear: true });
    if (ok) { setCurrentActive(null); setMessage(""); setStatus("idle"); }
    else { setStatus("error"); setTimeout(() => setStatus("idle"), 3000); }
  }

  return (
    <section className="mb-10">
      <h2 className="text-base font-black text-gray-900 mb-4">Site-Wide Banner</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">

        {currentActive && (
          <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-sm text-gray-700">
              <span className="font-bold">Active:</span> {currentActive.message}
              <span className="ml-2 text-xs text-gray-400">[{currentActive.type}]</span>
            </p>
            <button
              onClick={handleClear}
              disabled={status === "clearing"}
              className="shrink-0 text-xs font-bold text-red-600 hover:text-red-800 disabled:opacity-40"
            >
              {status === "clearing" ? "Clearing…" : "Clear banner"}
            </button>
          </div>
        )}

        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                type === t.value ? t.color : "bg-white text-gray-400 border-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Scheduled maintenance tonight 10pm–11pm CT"
          maxLength={200}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />

        <div className="flex items-center gap-4">
          <button
            onClick={handlePost}
            disabled={!message.trim() || status === "saving"}
            className="bg-gray-900 text-white text-sm font-black px-6 py-2.5 rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {status === "saving" ? "Posting…" : currentActive ? "Update banner" : "Post banner"}
          </button>
          {status === "ok" && (
            <p className="text-sm text-green-600 font-bold">
              Banner posted ✓{sent !== null ? ` · notified ${sent} device${sent === 1 ? "" : "s"}` : ""}
            </p>
          )}
          {status === "error" && <p className="text-sm text-red-500 font-bold">Failed — try again</p>}
        </div>
      </div>
    </section>
  );
}
