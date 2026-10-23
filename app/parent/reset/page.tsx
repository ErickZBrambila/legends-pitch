"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    setError("");
    const res = await fetch("/api/parent/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);

    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/parent/login"), 2500);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Something went wrong. Please try again.");
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-400 text-sm">Invalid reset link.</p>
        <Link href="/parent/forgot" className="block mt-4 text-sm text-[var(--color-accent)] hover:opacity-80 transition-opacity">
          Request a new one
        </Link>
      </div>
    );
  }

  return done ? (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 text-center">
      <p className="text-4xl mb-4">✅</p>
      <p className="text-white font-semibold mb-2">Password updated!</p>
      <p className="text-gray-400 text-sm">Redirecting you to sign in…</p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur rounded-2xl p-6 shadow-2xl border border-white/10 flex flex-col gap-4">
      <div>
        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2">
          New Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          required
          autoFocus
          className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter your password"
          required
          className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
        />
      </div>
      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1.5">
          <span>⚠</span> {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !password || !confirm}
        className="w-full py-3 bg-[var(--color-accent)] text-[var(--color-navy)] font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Saving…" : "Set New Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--color-navy)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[var(--color-accent)] shadow-xl">
            <Image src="/logo.jpg" alt="North Legends FC" width={80} height={80} className="object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white">Set New Password</h1>
            <p className="text-sm text-gray-300 mt-1">North Legends FC · Family Portal</p>
          </div>
        </div>
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
