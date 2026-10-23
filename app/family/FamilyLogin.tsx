"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";

const DIGITS = 4;

export default function FamilyLogin({ next }: { next: string }) {
  const [digits, setDigits] = useState<string[]>(Array(DIGITS).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function focusAt(index: number) {
    inputs.current[Math.max(0, Math.min(DIGITS - 1, index))]?.focus();
  }

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError("");
    if (digit) focusAt(index + 1);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else {
        focusAt(index - 1);
      }
    } else if (e.key === "ArrowLeft") {
      focusAt(index - 1);
    } else if (e.key === "ArrowRight") {
      focusAt(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGITS);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < DIGITS; i++) {
      next[i] = pasted[i] ?? "";
    }
    setDigits(next);
    focusAt(Math.min(pasted.length, DIGITS - 1));
  }

  const pin = digits.join("");
  const ready = pin.length === DIGITS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/family/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: pin }),
    });

    if (res.ok) {
      window.location.href = next;
    } else {
      setError("Incorrect PIN · PIN incorrecto");
      setDigits(Array(DIGITS).fill(""));
      focusAt(0);
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
            <p className="text-sm text-gray-300 mt-1">North Legends FC · Families only · Solo familias</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur rounded-2xl p-5 mb-4 border border-white/10">
          <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-3">
            With a parent account · Con cuenta de padre/madre
          </p>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5 text-sm text-gray-200">
              <span className="text-base leading-none mt-0.5">⚽</span>
              <span>Link your child&apos;s player profile · <span className="text-gray-400">Vincula el perfil de tu hijo/a</span></span>
            </li>
            <li className="flex items-start gap-2.5 text-sm text-gray-200">
              <span className="text-base leading-none mt-0.5">📅</span>
              <span>Personalized game-day info per player · <span className="text-gray-400">Info del día de juego personalizada</span></span>
            </li>
            <li className="flex items-start gap-2.5 text-sm text-gray-200">
              <span className="text-base leading-none mt-0.5">🔔</span>
              <span>More features coming for registered parents · <span className="text-gray-400">Más funciones próximamente</span></span>
            </li>
          </ul>
          <div className="mt-4 flex gap-2">
            <Link
              href="/parent/register"
              className="flex-1 text-center py-2 bg-[var(--color-accent)] text-[var(--color-navy)] text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Create account · Crear cuenta
            </Link>
            <Link
              href="/parent/login"
              className="flex-1 text-center py-2 bg-white/10 text-white text-sm font-semibold rounded-lg hover:bg-white/20 transition-colors"
            >
              Sign in · Iniciar sesión
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mb-4">
          — or just use the team code · o usa el código del equipo —
        </p>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur rounded-2xl p-6 shadow-2xl border border-white/10">
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-widest mb-4 text-center">
            4-Digit PIN · PIN de 4 Dígitos
          </label>

          <div className="flex justify-center gap-3 mb-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={d}
                autoFocus={i === 0}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                className={`w-14 h-16 text-center text-2xl font-black rounded-xl border-2 bg-white/10 text-white
                  focus:outline-none transition-colors caret-transparent
                  ${d ? "border-[var(--color-accent)]" : "border-white/20"}
                  ${error ? "border-red-400" : ""}
                  focus:border-[var(--color-accent)]`}
              />
            ))}
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-400 flex items-center justify-center gap-1.5">
              <span>⚠</span> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !ready}
            className="mt-5 w-full py-3 bg-[var(--color-accent)] text-[var(--color-navy)] font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Checking…" : "Enter · Entrar"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Get the PIN from Coach Hugo · Pide el PIN al Entrenador Hugo
        </p>
      </div>
    </div>
  );
}
