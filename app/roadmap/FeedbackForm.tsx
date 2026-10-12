"use client";

import { useState } from "react";

export default function FeedbackForm() {
  const [form, setForm] = useState({ name: "", email: "", type: "feature", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setStatus(res.ok ? "success" : "error");
    if (res.ok) setForm({ name: "", email: "", type: "feature", message: "" });
  }

  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-2xl mb-2">🙌</p>
        <p className="font-bold text-green-800">Got it — thank you!</p>
        <p className="text-sm text-green-700 mt-1">
          We review every submission. · Revisamos cada envío.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-xs text-green-600 underline"
        >
          Submit another · Enviar otro
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Name · Nombre <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Your name"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Email <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="your@email.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Type · Tipo
        </label>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "feature", label: "💡 Feature idea" },
            { value: "bug",     label: "🐛 Bug report" },
            { value: "general", label: "💬 General feedback" },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, type: opt.value }))}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                form.type === opt.value
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Message · Mensaje <span className="text-red-400">*</span>
        </label>
        <textarea
          required
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="Tell us what you think, what's broken, or what you'd love to see next…"
          rows={4}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-500">⚠ Something went wrong — try again.</p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !form.message.trim()}
        className="self-start px-6 py-2.5 bg-[var(--color-primary)] text-white text-sm font-bold rounded-lg hover:bg-[var(--color-primary-dark,#1a6b3a)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Sending…" : "Send feedback · Enviar"}
      </button>
    </form>
  );
}
