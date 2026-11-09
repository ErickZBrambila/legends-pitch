"use client";

import { useEffect, useState } from "react";
import AdminBreadcrumb from "@/components/AdminBreadcrumb";
import { type SplashVideo } from "@/app/api/admin/championship/route";

export default function ChampionshipAdminPage() {
  const [splashEnabled, setSplashEnabled] = useState<boolean | null>(null);
  const [splashVideo, setSplashVideo] = useState<SplashVideo | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/championship")
      .then((r) => r.json())
      .then((d) => {
        setSplashEnabled(d.splashEnabled);
        setSplashVideo(d.splashVideo);
      });
  }, []);

  async function save(patch: Partial<{ splashEnabled: boolean; splashVideo: SplashVideo }>) {
    setSaving(true);
    setSaved(false);
    const r = await fetch("/api/admin/championship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (r.ok) {
      if (typeof patch.splashEnabled === "boolean") setSplashEnabled(patch.splashEnabled);
      if (patch.splashVideo) setSplashVideo(patch.splashVideo);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  const loading = splashEnabled === null || splashVideo === null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <AdminBreadcrumb
          crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Championship" }]}
        />

        <h1 className="text-2xl font-black text-gray-900 mt-6 mb-1">Championship Splash</h1>
        <p className="text-sm text-gray-500 mb-8">
          Control the intro experience families see when they open the championship page. Changes take effect immediately — no deploy needed.
        </p>

        {/* Toggle 1: Enable / Disable */}
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-5 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-black text-gray-900">Championship Intro</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Show a full-screen splash video when families first land on the championship page.
              </p>
            </div>
            <button
              onClick={() => !loading && !saving && save({ splashEnabled: !splashEnabled })}
              disabled={loading || saving}
              className="shrink-0 relative w-12 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              style={{
                background: splashEnabled ? "#d4af37" : "#d1d5db",
                opacity: loading ? 0.5 : 1,
              }}
              aria-label={splashEnabled ? "Disable splash" : "Enable splash"}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: splashEnabled ? "translateX(24px)" : "translateX(0)" }}
              />
            </button>
          </div>
        </div>

        {/* Toggle 2: Video choice */}
        <div
          className="bg-white rounded-2xl border border-gray-200 px-6 py-5 mb-6 transition-opacity"
          style={{ opacity: !splashEnabled || loading ? 0.4 : 1, pointerEvents: !splashEnabled || loading ? "none" : "auto" }}
        >
          <p className="font-black text-gray-900 mb-4">Intro Video</p>
          <div className="flex flex-col gap-3">
            {(
              [
                { value: "goal" as SplashVideo, label: "Championship Intro", desc: "Cinematic Higgsfield goal · golden lens flare", duration: "8 s" },
                { value: "reel" as SplashVideo, label: "Squad Reel", desc: "Full season highlights · Legends_V1", duration: "4 min 25 s" },
              ] as const
            ).map((opt) => {
              const active = splashVideo === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => save({ splashVideo: opt.value })}
                  disabled={saving}
                  className="text-left rounded-xl border-2 px-5 py-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  style={{
                    borderColor: active ? "#d4af37" : "#e5e7eb",
                    background: active ? "rgba(212,175,55,0.06)" : "white",
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{opt.duration}</p>
                    </div>
                    <div
                      className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: active ? "#d4af37" : "#d1d5db" }}
                    >
                      {active && (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#d4af37" }} />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {saved && (
          <p className="text-sm text-green-600 font-semibold text-center">✓ Saved</p>
        )}
        {saving && (
          <p className="text-sm text-gray-400 text-center">Saving…</p>
        )}
        {loading && (
          <p className="text-sm text-gray-400 text-center">Loading…</p>
        )}
      </div>
    </div>
  );
}
