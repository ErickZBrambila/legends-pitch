"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function RegisterForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [teamPin, setTeamPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (!displayName.trim()) return "Your name is required.";
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!teamPin.trim()) return "Team PIN is required.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailTaken(false);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const pinRes = await fetch("/api/family/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: teamPin }),
      });
      if (!pinRes.ok) {
        setError("Incorrect Team PIN · PIN incorrecto");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/parent/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      if (res.ok) {
        window.location.href = "/parent/account?welcome=1";
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        setEmailTaken(true);
        setError("Email already registered.");
      } else if (res.status === 429) {
        setError("Too many attempts, try again later.");
      } else {
        setError(data?.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-navy)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[var(--color-accent)] shadow-xl">
            <Image src="/logo.jpg" alt="North Legends FC" width={80} height={80} className="object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white">Create Parent Account</h1>
            <p className="text-sm text-gray-300 mt-1">North Legends FC · Family Portal</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur rounded-2xl p-6 shadow-2xl border border-white/10 flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="displayName"
              className="block text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2"
            >
              Your Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Maria Garcia"
              required
              autoFocus
              className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              minLength={8}
              className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="teamPin"
              className="block text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2"
            >
              Team PIN · PIN del Equipo
            </label>
            <input
              id="teamPin"
              type="tel"
              inputMode="numeric"
              maxLength={4}
              value={teamPin}
              onChange={(e) => setTeamPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="4-digit code from your coach"
              required
              className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm tracking-widest"
            />
            <p className="text-xs text-gray-500 mt-1">Get the PIN from Coach Hugo · Pide el PIN al Entrenador Hugo</p>
          </div>

          {error && (
            <div className="text-sm text-red-400 flex flex-col gap-1">
              <p className="flex items-center gap-1.5">
                <span>⚠</span> {error}
              </p>
              {emailTaken && (
                <p className="text-gray-400">
                  Already have an account?{" "}
                  <Link href="/parent/login" className="text-[var(--color-accent)] underline underline-offset-2">
                    Sign in here
                  </Link>
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full py-3 bg-[var(--color-accent)] text-[var(--color-navy)] font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <p className="text-center text-xs text-gray-400">
            You&apos;ll link your child&apos;s player profile after signing in.
          </p>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/parent/login" className="text-[var(--color-accent)] hover:opacity-80 transition-opacity">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
