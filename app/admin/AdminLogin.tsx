"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      setError("Incorrect password. Try again.");
      setPassword("");
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
            <h1 className="text-2xl font-black text-white">Team Admin</h1>
            <p className="text-sm text-gray-400 mt-0.5">North Legends FC</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-white/5">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter coach password"
            required
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
          />

          {error && (
            <p className="mt-3 text-sm text-red-400 flex items-center gap-1.5">
              <span>⚠</span> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="mt-4 w-full py-3 bg-[var(--color-accent)] text-[#1c1c1e] font-bold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          North Legends FC · Coaches only
        </p>
      </div>
    </div>
  );
}
