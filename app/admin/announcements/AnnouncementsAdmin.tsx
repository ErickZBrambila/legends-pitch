"use client";

import { useState } from "react";
import Image from "next/image";
import type { Announcement } from "@/lib/types";
import type { TeamSlug } from "@/lib/sanity/queries";
import AdminBreadcrumb from "@/components/AdminBreadcrumb";
import AdminImageUploader from "@/components/AdminImageUploader";

type TargetTeam = "u11" | "u12" | "both";

interface Props {
  initialAnnouncements: Announcement[];
  team: TeamSlug;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    timeZone: "America/Chicago",
  });
}

export default function AnnouncementsAdmin({ initialAnnouncements, team }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ message: "", author: "", location: "", eventTime: "" });
  const [targetTeam, setTargetTeam] = useState<TargetTeam>(team);
  const [submitting, setSubmitting] = useState(false);
  const [preview_en, setPreview_en] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageAssetId, setImageAssetId] = useState<string | null>(null);

  async function postToTeam(t: TeamSlug) {
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team: t,
        message: form.message,
        author: form.author,
        ...(form.location.trim() ? { location: form.location.trim() } : {}),
        ...(form.eventTime ? { eventTime: new Date(form.eventTime).toISOString() } : {}),
        ...(imageAssetId ? { imageAssetId } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Unknown error");
    return data;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.message.trim() || !form.author.trim()) return;
    setSubmitting(true);
    setError(null);
    setPreview_en(null);

    try {
      const teamsToPost: TeamSlug[] = targetTeam === "both" ? ["u11", "u12"] : [targetTeam];
      const results = await Promise.all(teamsToPost.map(postToTeam));
      const firstResult = results[0];

      setPreview_en(firstResult.message_en ?? null);

      const newAnnouncement: Announcement = {
        id: firstResult.id,
        message: firstResult.message_en ?? form.message,
        message_es: form.message,
        author: form.author,
        publishedAt: new Date().toISOString(),
        location: form.location.trim() || undefined,
        eventTime: form.eventTime ? new Date(form.eventTime).toISOString() : undefined,
      };
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      setForm({ message: "", author: "", location: "", eventTime: "" });
      setImageAssetId(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post announcement");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-[#1c1c1e] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--color-accent)] shadow-md flex-shrink-0">
              <Image src="/logo.jpg" alt="crest" width={32} height={32} className="object-cover" />
            </div>
            <AdminBreadcrumb crumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Announcements" }]} />
          </div>
          <div className="flex items-center gap-3">
            <a href={`/announcements?team=${team}`} target="_blank" className="text-xs text-gray-400 hover:text-white transition-colors">
              View public ↗
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">Anuncios / Announcements</h1>
            <p className="text-sm text-gray-500 mt-0.5">Escribe en español — Claude traduce al inglés automáticamente.</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setPreview_en(null); setError(null); }}
            className="px-4 py-2 bg-[var(--color-accent)] text-[#1c1c1e] text-sm font-bold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors"
          >
            + New Announcement
          </button>
        </div>

        {/* New announcement form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-base font-black text-gray-800 mb-4">Nuevo Anuncio / New Announcement</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Equipo / Team</label>
                <div className="flex gap-2">
                  {([["u11", "U11"], ["u12", "U12"], ["both", "Ambos / Both"]] as [TargetTeam, string][]).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTargetTeam(val)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-all ${
                        targetTeam === val
                          ? "bg-[var(--color-accent)] text-[#1c1c1e] border-transparent shadow-sm"
                          : "text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Mensaje (Español)</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="El práctica se mueve al jueves a las 6pm en Brushy Creek. ¡Traigan espinilleras!"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">Escribe en español — Claude traduce al inglés automáticamente. / Write in Spanish — Claude translates to English.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Entrenador / Coach Name</label>
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                    placeholder="Coach Hugo"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ubicación / Location (opcional)</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Brushy Creek Park Field 3"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fecha y hora del evento / Event Date & Time (opcional)</label>
                <input
                  type="datetime-local"
                  value={form.eventTime}
                  onChange={(e) => setForm((f) => ({ ...f, eventTime: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] bg-white"
                />
                <p className="text-xs text-gray-400 mt-1">Muestra el pronóstico del tiempo en el anuncio. / Shows a weather forecast on the announcement.</p>
              </div>

              <AdminImageUploader
                onUploaded={(assetId) => setImageAssetId(assetId)}
                onCleared={() => setImageAssetId(null)}
              />

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 rounded-lg bg-[var(--color-accent)] text-[#1c1c1e] text-sm font-bold hover:bg-[var(--color-accent-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Publicando…" : targetTeam === "both" ? "Publicar para Ambos Equipos" : "Publicar Anuncio"}
                </button>
              </div>
            </form>

            {preview_en && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">English translation / Traducción al inglés (auto-generated)</p>
                <p className="text-sm text-blue-900 whitespace-pre-line">{preview_en}</p>
              </div>
            )}
          </div>
        )}

        {/* Announcements list */}
        {announcements.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">No announcements yet</p>
            <p className="text-sm">Click &quot;+ New Announcement&quot; to post one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      {a.author} · {formatDate(a.publishedAt)}
                      {a.location && <span className="ml-2 text-gray-400">📍 {a.location}</span>}
                    </p>
                    <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{a.message_es ?? a.message}</p>
                    {a.message_es && (
                      <p className="text-xs text-gray-400 mt-2 italic whitespace-pre-line">{a.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
