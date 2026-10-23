"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Mode = "account" | "master";

export default function AdminLogin() {
  const [mode, setMode] = useState<Mode>("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = mode === "master" ? { password } : { email, password };

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      window.location.href = "/admin/dashboard";
    } else {
      setError(
        mode === "master"
          ? "Incorrect master password."
          : "Incorrect email or password."
      );
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Logo + title */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[var(--color-accent)] shadow-xl">
            <Image src="/logo.jpg" alt="North Legends FC" width={80} height={80} className="object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white">Team Admin</h1>
            <p className="text-sm text-gray-400 mt-0.5">North Legends FC</p>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-white/5 flex flex-col gap-4">

          {mode === "account" ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coach@northlegendsfc.com"
                  required
                  autoFocus
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Master Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
              />
              <p className="mt-2 text-xs text-gray-500">
                Temporary access — set up your personal account afterwards.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 flex items-center gap-1.5">
              <span>⚠</span> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password || (mode === "account" && !email)}
            className="w-full py-3 bg-[var(--color-accent)] text-[#1c1c1e] font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <button
            type="button"
            onClick={() => switchMode(mode === "account" ? "master" : "account")}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors text-center"
          >
            {mode === "account"
              ? "Use master password instead →"
              : "← Sign in with my account"}
          </button>
        </form>

        {/* Coach request access card */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Are you a coach?</p>
            <p className="text-xs text-gray-400 mt-1">
              Request your personal account — you set your own password, and Erick approves access.
            </p>
          </div>
          <Link
            href="/admin/register"
            className="w-full py-2.5 rounded-lg border border-[var(--color-accent)]/40 text-[var(--color-accent)] text-sm font-semibold text-center hover:bg-[var(--color-accent)]/10 transition-colors"
          >
            Request Access →
          </Link>
        </div>

      </div>
    </div>
  );
}
