"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Player } from "@/lib/types";

type Step = "password" | "photo";

interface Submission { id: string; submittedAt: string }

interface Props {
  player: Player;
  onClose: () => void;
}

export default function PhotoSubmitModal({ player, onClose }: Props) {
  const [step, setStep] = useState<Step>("password");
  const [passcode, setPasscode] = useState("");
  const [passError, setPassError] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  const [existing, setExisting] = useState<Submission | null>(null);
  const [existingChecked, setExistingChecked] = useState(false);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function verifyPassword(e: React.FormEvent) {
    e.preventDefault();
    setPassLoading(true);
    setPassError("");
    try {
      const res = await fetch("/api/family/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) { setPassError("Incorrect password · Contraseña incorrecta"); return; }

      // Check for existing pending submission
      const check = await fetch(`/api/photo-submission?playerId=${player.id}`);
      const data = await check.json();
      setExisting(data.submission ?? null);
      setExistingChecked(true);
      setStep("photo");
    } finally {
      setPassLoading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setSubmitError("");
  }

  async function submitPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitLoading(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("playerId", player.id);
      fd.append("photo", file);

      const url = existing ? `/api/photo-submission/${existing.id}` : "/api/photo-submission";
      const method = existing ? "PUT" : "POST";

      const res = await fetch(url, { method, body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSubmitError(d.error ?? "Something went wrong");
        return;
      }
      setDone(true);
    } finally {
      setSubmitLoading(false);
    }
  }

  async function deleteSubmission() {
    if (!existing) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/photo-submission/${existing.id}`, { method: "DELETE" });
      if (res.ok) setDone(true);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900 text-sm">
              {step === "password" ? "Team Password" : `Photo for ${player.name}`}
            </p>
            <p className="text-xs text-gray-400">#{player.number} · {player.position}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5">
          {/* ── Password step ── */}
          {step === "password" && (
            <form onSubmit={verifyPassword} className="flex flex-col gap-3">
              <p className="text-sm text-gray-500">Enter the team password to continue · Ingresa la contraseña del equipo</p>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Team password"
                autoFocus
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
              />
              {passError && <p className="text-xs text-red-500">{passError}</p>}
              <button
                type="submit"
                disabled={passLoading || !passcode}
                className="w-full py-2.5 bg-[var(--color-navy)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {passLoading ? "Checking…" : "Continue · Continuar"}
              </button>
            </form>
          )}

          {/* ── Done state ── */}
          {step === "photo" && done && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="text-4xl">{file ? "✅" : "🗑️"}</span>
              <p className="font-semibold text-gray-800">
                {file ? "Photo submitted!" : "Submission removed"}
              </p>
              <p className="text-sm text-gray-500">
                {file
                  ? "Coach Hugo will review it and add it to the roster."
                  : "Your photo submission has been deleted."}
              </p>
              <button onClick={onClose} className="mt-1 px-5 py-2 bg-[var(--color-navy)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity">
                Close
              </button>
            </div>
          )}

          {/* ── Photo step ── */}
          {step === "photo" && !done && existingChecked && (
            <form onSubmit={submitPhoto} className="flex flex-col gap-4">
              {existing && !preview && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    You already have a pending submission. Pick a new photo to replace it, or remove the current one.
                  </p>
                </div>
              )}

              {/* Preview */}
              {preview ? (
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <Image src={preview} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPreview(null); setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-black/70"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[var(--color-accent)] hover:text-[var(--color-navy)] transition-colors"
                >
                  <span className="text-3xl">📷</span>
                  <span className="text-sm font-medium">Tap to choose photo</span>
                  <span className="text-xs">JPG or PNG · max 5 MB</span>
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onFileChange}
              />

              {submitError && <p className="text-xs text-red-500">{submitError}</p>}

              <button
                type="submit"
                disabled={!file || submitLoading}
                className="w-full py-2.5 bg-[var(--color-navy)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {submitLoading ? "Uploading…" : existing ? "Update Photo" : "Submit Photo"}
              </button>

              {existing && (
                <button
                  type="button"
                  onClick={deleteSubmission}
                  disabled={deleteLoading}
                  className="w-full py-2 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
                >
                  {deleteLoading ? "Removing…" : "Remove my submission"}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
