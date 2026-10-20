"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminBreadcrumb from "@/components/AdminBreadcrumb";
import AdminLangToggle from "@/components/AdminLangToggle";
import type { GalleryEvent, HighlightVideo } from "@/lib/types";
import type { TeamSlug } from "@/lib/sanity/queries";

type Tab = "photos" | "videos";

interface PendingPhoto {
  file: File;
  localUrl: string;
  assetId: string | null;
  uploading: boolean;
  error: string | null;
}

interface Props {
  team: TeamSlug;
  locale: string;
  initialAlbums: GalleryEvent[];
  initialVideos: HighlightVideo[];
}

export default function MediaAdmin({ team, locale, initialAlbums, initialVideos }: Props) {
  const [tab, setTab] = useState<Tab>("photos");
  const [albums, setAlbums] = useState(initialAlbums);
  const [videos, setVideos] = useState(initialVideos);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1c1c1e] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--color-accent)] shadow-md flex-shrink-0">
              <Image src="/logo.jpg" alt="crest" width={32} height={32} className="object-cover" />
            </div>
            <AdminBreadcrumb
              crumbs={[
                { label: locale === "es" ? "Admin" : "Admin", href: "/admin/dashboard" },
                { label: locale === "es" ? "Medios" : "Media" },
              ]}
            />
          </div>
          <div className="flex items-center gap-3">
            <AdminLangToggle locale={locale} />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {locale === "es" ? "Fotos y Videos" : "Photos & Videos"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {locale === "es"
                ? `Equipo ${team.toUpperCase()} — fotos y videos para la galería pública.`
                : `Team ${team.toUpperCase()} — photos and videos for the public gallery.`}
            </p>
          </div>
          {/* Team switcher — reloads the page with fresh Sanity data for that team */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm flex-shrink-0">
            {(["u11", "u12"] as TeamSlug[]).map((slug) => (
              <Link
                key={slug}
                href={`/admin/media?team=${slug}`}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  team === slug
                    ? "bg-[var(--color-accent)] text-[#1c1c1e] shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {slug.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
          {(["photos", "videos"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-[var(--color-accent)] text-[#1c1c1e] shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t === "photos"
                ? locale === "es" ? "Fotos" : "Photos"
                : locale === "es" ? "Videos" : "Videos"}
            </button>
          ))}
        </div>

        {tab === "photos" && (
          <PhotosTab team={team} locale={locale} albums={albums} setAlbums={setAlbums} />
        )}
        {tab === "videos" && (
          <VideosTab team={team} locale={locale} videos={videos} setVideos={setVideos} />
        )}
      </div>
    </div>
  );
}

// ── Photos Tab ────────────────────────────────────────────────────────────────

function PhotosTab({
  team,
  locale,
  albums,
  setAlbums,
}: {
  team: TeamSlug;
  locale: string;
  albums: GalleryEvent[];
  setAlbums: React.Dispatch<React.SetStateAction<GalleryEvent[]>>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumDate, setAlbumDate] = useState(new Date().toISOString().slice(0, 10));
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isEN = locale !== "es";

  async function uploadFile(file: File): Promise<{ assetId: string; url: string } | null> {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch("/api/admin/upload-image", { method: "POST", body: form });
    if (!res.ok) return null;
    return res.json();
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const newItems: PendingPhoto[] = Array.from(files).map((f) => ({
      file: f,
      localUrl: URL.createObjectURL(f),
      assetId: null,
      uploading: true,
      error: null,
    }));
    setPending((prev) => [...prev, ...newItems]);

    newItems.forEach(async (item) => {
      const result = await uploadFile(item.file);
      setPending((prev) =>
        prev.map((p) =>
          p.localUrl === item.localUrl
            ? result
              ? { ...p, assetId: result.assetId, uploading: false }
              : { ...p, uploading: false, error: isEN ? "Upload failed" : "Error al subir" }
            : p
        )
      );
    });
  }

  function removePhoto(localUrl: string) {
    setPending((prev) => prev.filter((p) => p.localUrl !== localUrl));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!albumTitle.trim() || pending.length === 0) return;
    const ready = pending.filter((p) => p.assetId && !p.uploading);
    if (ready.length === 0) return;

    setSaving(true);
    setSaveError(null);

    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team,
        title: albumTitle.trim(),
        date: albumDate,
        images: ready.map((p) => ({ assetId: p.assetId!, alt: "" })),
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setSaveError(d.error ?? (isEN ? "Failed to create album" : "Error al crear el álbum"));
      setSaving(false);
      return;
    }

    const { id } = await res.json();
    setAlbums((prev) => [
      {
        id,
        title: albumTitle.trim(),
        date: albumDate,
        images: ready.map((p, i) => ({ id: `tmp-${i}`, url: p.localUrl, alt: "" })),
      },
      ...prev,
    ]);
    setAlbumTitle("");
    setPending([]);
    setSaving(false);
  }

  async function deleteAlbum(id: string) {
    if (!confirm(isEN ? "Delete this album?" : "¿Eliminar este álbum?")) return;
    const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    if (res.ok) setAlbums((prev) => prev.filter((a) => a.id !== id));
  }

  const uploading = pending.some((p) => p.uploading);
  const readyCount = pending.filter((p) => p.assetId && !p.uploading).length;
  const canSubmit = albumTitle.trim() && readyCount > 0 && !saving;

  return (
    <div className="flex flex-col gap-6">
      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4"
      >
        <h2 className="text-base font-black text-gray-800">
          {isEN ? "New Album" : "Nuevo Álbum"}
        </h2>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {isEN ? "Album Title" : "Título del Álbum"}
            </label>
            <input
              type="text"
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              placeholder={isEN ? "e.g. Game vs. Austin FC" : "ej. Partido vs Austin FC"}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {isEN ? "Date" : "Fecha"}
            </label>
            <input
              type="date"
              value={albumDate}
              onChange={(e) => setAlbumDate(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* Drop zone */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {isEN ? "Photos" : "Fotos"}
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[var(--color-accent)] hover:bg-amber-50/30 transition-colors"
          >
            <p className="text-sm text-gray-400">
              {isEN ? "Drop photos here or " : "Arrastra fotos aquí o "}
              <span className="text-[var(--color-accent)] font-semibold">
                {isEN ? "browse" : "selecciona"}
              </span>
            </p>
            <p className="text-xs text-gray-300 mt-1">JPEG, PNG, WebP · max 10 MB each</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* Pending previews */}
        {pending.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {pending.map((p) => (
              <div key={p.localUrl} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.localUrl} alt="" className="w-full h-full object-cover" />
                {p.uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">
                      {isEN ? "Uploading…" : "Subiendo…"}
                    </span>
                  </div>
                )}
                {p.error && (
                  <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold text-center px-1">{p.error}</span>
                  </div>
                )}
                {!p.uploading && (
                  <button
                    type="button"
                    onClick={() => removePhoto(p.localUrl)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center justify-center hover:bg-black/80"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <p className="text-xs text-gray-400">
            {isEN ? `Uploading ${pending.filter((p) => p.uploading).length} photo(s)…` : `Subiendo ${pending.filter((p) => p.uploading).length} foto(s)…`}
          </p>
        )}

        {saveError && <p className="text-xs text-red-600">{saveError}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="self-start px-5 py-2 bg-[var(--color-accent)] text-[#1c1c1e] text-sm font-bold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving
            ? isEN ? "Creating…" : "Creando…"
            : isEN
            ? `Create Album${readyCount > 0 ? ` (${readyCount} photo${readyCount !== 1 ? "s" : ""})` : ""}`
            : `Crear Álbum${readyCount > 0 ? ` (${readyCount} foto${readyCount !== 1 ? "s" : ""})` : ""}`}
        </button>
      </form>

      {/* Existing albums */}
      {albums.length > 0 && (
        <div>
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">
            {isEN ? "Albums" : "Álbumes"}
          </h2>
          <div className="flex flex-col gap-3">
            {albums.map((album) => (
              <div key={album.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                {/* Thumbnail strip */}
                <div className="flex gap-1 flex-shrink-0">
                  {album.images.slice(0, 3).map((img) => (
                    <div key={img.id} className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {album.images.length === 0 && (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-lg">📷</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{album.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(album.date + "T12:00:00").toLocaleDateString(locale === "es" ? "es-MX" : "en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })} · {album.images.length} {isEN ? "photo" : "foto"}{album.images.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => deleteAlbum(album.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  {isEN ? "Delete" : "Eliminar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {albums.length === 0 && pending.length === 0 && (
        <div className="text-center py-16 text-gray-300">
          <p className="text-4xl mb-2">📷</p>
          <p className="text-sm font-medium text-gray-400">
            {isEN ? "No albums yet" : "Aún no hay álbumes"}
          </p>
          <p className="text-xs mt-1 text-gray-300">
            {isEN ? "Create one above to add photos to the gallery." : "Crea uno arriba para agregar fotos a la galería."}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Videos Tab ────────────────────────────────────────────────────────────────

type VideoSource = "youtube" | "upload";

function VideosTab({
  team,
  locale,
  videos,
  setVideos,
}: {
  team: TeamSlug;
  locale: string;
  videos: HighlightVideo[];
  setVideos: React.Dispatch<React.SetStateAction<HighlightVideo[]>>;
}) {
  const isEN = locale !== "es";
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<VideoSource>("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<"idle" | "uploading" | "done">("idle");
  const [uploadedR2Url, setUploadedR2Url] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [event, setEvent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function resetForm() {
    setYoutubeUrl("");
    setVideoFile(null);
    setUploadedR2Url(null);
    setUploadProgress("idle");
    setTitle("");
    setEvent("");
  }

  async function handleVideoFile(file: File) {
    setVideoFile(file);
    setUploadProgress("uploading");
    setUploadedR2Url(null);
    setSaveError(null);

    const form = new FormData();
    form.append("video", file);
    const res = await fetch("/api/admin/upload-video", { method: "POST", body: form });
    if (!res.ok) {
      const d = await res.json();
      setSaveError(d.error ?? (isEN ? "Upload failed" : "Error al subir"));
      setUploadProgress("idle");
      setVideoFile(null);
      return;
    }
    const { url } = await res.json();
    setUploadedR2Url(url);
    setUploadProgress("done");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !event.trim()) return;
    if (source === "youtube" && !youtubeUrl.trim()) return;
    if (source === "upload" && !uploadedR2Url) return;

    setSaving(true);
    setSaveError(null);

    const res = await fetch("/api/admin/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team,
        title: title.trim(),
        event: event.trim(),
        ...(source === "youtube" ? { youtubeUrl: youtubeUrl.trim() } : { r2Url: uploadedR2Url }),
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setSaveError(d.error ?? (isEN ? "Failed to add video" : "Error al agregar el video"));
      setSaving(false);
      return;
    }

    const { id, youtubeId, r2Url } = await res.json();
    setVideos((prev) => [{ id, youtubeId, r2Url, title: title.trim(), event: event.trim() }, ...prev]);
    resetForm();
    setSaving(false);
  }

  async function deleteVideo(id: string) {
    if (!confirm(isEN ? "Delete this video?" : "¿Eliminar este video?")) return;
    const res = await fetch(`/api/admin/highlights/${id}`, { method: "DELETE" });
    if (res.ok) setVideos((prev) => prev.filter((v) => v.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4"
      >
        <h2 className="text-base font-black text-gray-800">
          {isEN ? "Add Highlight Video" : "Agregar Video Destacado"}
        </h2>

        {/* Source toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {(["youtube", "upload"] as VideoSource[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setSource(s); setSaveError(null); }}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                source === s
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {s === "youtube" ? "YouTube" : isEN ? "Upload File" : "Subir Archivo"}
            </button>
          ))}
        </div>

        {/* YouTube input */}
        {source === "youtube" && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              YouTube URL
            </label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        )}

        {/* File upload */}
        {source === "upload" && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {isEN ? "Video File" : "Archivo de Video"}
            </label>
            {uploadedR2Url ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-600 text-lg">✓</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-green-800 truncate">{videoFile?.name}</p>
                  <p className="text-[10px] text-green-600">{isEN ? "Uploaded to R2" : "Subido a R2"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setVideoFile(null); setUploadedR2Url(null); setUploadProgress("idle"); }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  {isEN ? "Remove" : "Quitar"}
                </button>
              </div>
            ) : uploadProgress === "uploading" ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-blue-700 font-semibold truncate">
                  {isEN ? `Uploading ${videoFile?.name}…` : `Subiendo ${videoFile?.name}…`}
                </p>
              </div>
            ) : (
              <div
                onClick={() => videoInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleVideoFile(f); }}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[var(--color-accent)] hover:bg-amber-50/30 transition-colors"
              >
                <p className="text-sm text-gray-400">
                  {isEN ? "Drop video here or " : "Arrastra un video aquí o "}
                  <span className="text-[var(--color-accent)] font-semibold">
                    {isEN ? "browse" : "selecciona"}
                  </span>
                </p>
                <p className="text-xs text-gray-300 mt-1">MP4, MOV, WebM · max 500 MB</p>
              </div>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoFile(f); }}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {isEN ? "Video Title" : "Título del Video"}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isEN ? "e.g. Goal Highlights – Game 5" : "ej. Goles Destacados – Partido 5"}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {isEN ? "Event / Album" : "Evento / Álbum"}
          </label>
          <input
            type="text"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            placeholder={isEN ? "e.g. Spring 2026 Season" : "ej. Temporada Primavera 2026"}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        {saveError && <p className="text-xs text-red-600">{saveError}</p>}

        <button
          type="submit"
          disabled={saving || uploadProgress === "uploading"}
          className="self-start px-5 py-2 bg-[var(--color-accent)] text-[#1c1c1e] text-sm font-bold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? isEN ? "Adding…" : "Agregando…" : isEN ? "Add Video" : "Agregar Video"}
        </button>
      </form>

      {/* Existing videos */}
      {videos.length > 0 && (
        <div>
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">
            {isEN ? "Videos" : "Videos"}
          </h2>
          <div className="flex flex-col gap-3">
            {videos.map((v) => (
              <div key={v.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                {v.youtubeId ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`}
                    alt={v.title}
                    className="w-24 h-14 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                  />
                ) : (
                  <div className="w-24 h-14 rounded-lg flex-shrink-0 bg-gray-900 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{v.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{v.event}</p>
                  {v.youtubeId ? (
                    <a
                      href={`https://youtu.be/${v.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[var(--color-primary)] hover:underline"
                    >
                      youtu.be/{v.youtubeId}
                    </a>
                  ) : (
                    <span className="text-[11px] text-blue-500 font-semibold">R2 Video</span>
                  )}
                </div>
                <button
                  onClick={() => deleteVideo(v.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  {isEN ? "Delete" : "Eliminar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length === 0 && (
        <div className="text-center py-16 text-gray-300">
          <p className="text-4xl mb-2">🎬</p>
          <p className="text-sm font-medium text-gray-400">
            {isEN ? "No highlight videos yet" : "Aún no hay videos destacados"}
          </p>
          <p className="text-xs mt-1 text-gray-300">
            {isEN ? "Paste a YouTube URL above to add one." : "Pega una URL de YouTube arriba para agregar uno."}
          </p>
        </div>
      )}
    </div>
  );
}
