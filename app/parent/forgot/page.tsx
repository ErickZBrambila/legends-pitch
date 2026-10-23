"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/parent/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) {
      setSent(true);
    } else {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-navy)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[var(--color-accent)] shadow-xl">
            <Image src="/logo.jpg" alt="North Legends FC" width={80} height={80} className="object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white">Forgot Password</h1>
            <p className="text-sm text-gray-300 mt-1">North Legends FC · Family Portal</p>
          </div>
        </div>

        {sent ? (
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 text-center">
            <p className="text-4xl mb-4">📬</p>
            <p className="text-white font-semibold mb-2">Check your email</p>
            <p className="text-gray-400 text-sm">
              If an account exists for <span className="text-white">{email}</span>, we sent a reset link. It expires in 1 hour.
            </p>
            <Link href="/parent/login" className="block mt-6 text-sm text-[var(--color-accent)] hover:opacity-80 transition-opacity">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur rounded-2xl p-6 shadow-2xl border border-white/10 flex flex-col gap-4">
            <p className="text-sm text-gray-300">
              Enter the email address on your account and we&apos;ll send you a reset link.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
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
              disabled={loading || !email}
              className="w-full py-3 bg-[var(--color-accent)] text-[var(--color-navy)] font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
            <Link href="/parent/login" className="text-center text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
