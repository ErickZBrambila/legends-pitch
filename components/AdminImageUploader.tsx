"use client";

import { useRef, useState } from "react";

interface Props {
  onUploaded: (assetId: string, previewUrl: string) => void;
  onCleared: () => void;
}

export default function AdminImageUploader({ onUploaded, onCleared }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onUploaded(data.assetId, data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
      onCleared();
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setPreview(null);
    setError(null);
    onCleared();
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        Image (optional)
      </label>

      {preview ? (
        <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full max-h-48 object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-600">Uploading…</span>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={clear}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 text-xs font-bold px-2 py-1 rounded-lg shadow transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[var(--color-accent)] hover:bg-amber-50/30 transition-colors"
        >
          <p className="text-sm text-gray-400">Drop an image here or <span className="text-[var(--color-accent)] font-semibold">browse</span></p>
          <p className="text-xs text-gray-300 mt-1">JPEG, PNG, WebP · max 10 MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
