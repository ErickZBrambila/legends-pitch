"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function FamilyLogin({ next }: { next: string }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/family/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });

    if (res.ok) {
      window.location.href = next;
    } else {
      setError("Incorrect passcode · Contraseña incorrecta");
      setPasscode("");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[var(--color-navy)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[var(--color-accent)] shadow-xl">
            <Image src="/logo.jpg" alt="North Legends FC" width={80} height={80} className="object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white">Team Access · Acceso al Equipo</h1>
            <p className="text-sm text-gray-300 mt-1">
              North Legends FC · Families only · Solo familias
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur rounded-2xl p-6 shadow-2xl border border-white/10">
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2">
            Team Passcode · Código del Equipo
          </label>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter passcode"
            required
            autoFocus
            className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
          />

          {error && (
            <p className="mt-3 text-sm text-red-400 flex items-center gap-1.5">
              <span>⚠</span> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !passcode}
            className="mt-4 w-full py-3 bg-[var(--color-accent)] text-[var(--color-navy)] font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Checking…" : "Enter · Entrar"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Get the passcode from Coach Hugo · Pide el código al Entrenador Hugo
        </p>
      </div>
    </div>
  );
}
