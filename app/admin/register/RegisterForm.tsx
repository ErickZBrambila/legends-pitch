"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function RegisterForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, email, password }),
    });

    if (res.status === 201) {
      setSuccess(true);
    } else if (res.status === 409) {
      setError("An account with that email already exists.");
    } else if (res.status === 503) {
      setError("Service unavailable — try again in a moment.");
    } else {
      setError("Something went wrong — try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[var(--color-accent)] shadow-xl">
            <Image src="/logo.jpg" alt="North Legends FC" width={80} height={80} className="object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white">Request Access</h1>
            <p className="text-sm text-gray-400 mt-0.5">North Legends FC · Admin</p>
          </div>
        </div>

        {success ? (
          <div className="bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-white/5 text-center">
            <p className="text-green-400 font-semibold text-sm leading-relaxed">
              Request sent! Erick will review your account and let you know when it&apos;s approved.
              You&apos;ll be able to sign in at that point.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-block text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-white/5 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Coach Hugo"
                required
                autoFocus
                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
              />
            </div>

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
                placeholder="min 8 characters"
                required
                minLength={8}
                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 flex items-center gap-1.5">
                <span>⚠</span> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !displayName || !email || !password || !confirmPassword}
              className="w-full py-3 bg-[var(--color-accent)] text-[#1c1c1e] font-bold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending request…" : "Request Access"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-600 mt-6">
          Already have an account?{" "}
          <Link href="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
