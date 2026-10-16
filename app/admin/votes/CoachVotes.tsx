"use client";

import { useState } from "react";
import Image from "next/image";
import AdminLangToggle from "@/components/AdminLangToggle";
import type { VoteData } from "@/lib/votes";

const CONTENT = {
  en: {
    heading: "Feature Voting",
    subheading: "Mark the features you want to prioritize as a coaching staff. See what parents are voting for too.",
    backToDashboard: "← Dashboard",
    prioritized: "⭐ Priority",
    markPriority: "Mark Priority",
    votes: (n: number) => `${n} vote${n !== 1 ? "s" : ""}`,
    features: {
      "player-stats":        { emoji: "📊", title: "Player Stats",        desc: "Goals, assists, and appearances per player across the season." },
      "attendance-tracking": { emoji: "✅", title: "Attendance Tracking", desc: "Mark who showed up to practice and games." },
      "season-awards":       { emoji: "🏆", title: "Season Awards",       desc: "Vote for MVP, most improved, and best attitude at end of season." },
    } as Record<string, { emoji: string; title: string; desc: string }>,
  },
  es: {
    heading: "Votación de Funciones",
    subheading: "Marca las funciones que quieres priorizar como cuerpo técnico. Ve también lo que votan los padres.",
    backToDashboard: "← Panel",
    prioritized: "⭐ Prioridad",
    markPriority: "Marcar Prioridad",
    votes: (n: number) => `${n} voto${n !== 1 ? "s" : ""}`,
    features: {
      "player-stats":        { emoji: "📊", title: "Estadísticas de Jugadores", desc: "Goles, asistencias y apariciones por jugador en la temporada." },
      "attendance-tracking": { emoji: "✅", title: "Control de Asistencia",     desc: "Registra quién asistió a los entrenamientos y partidos." },
      "season-awards":       { emoji: "🏆", title: "Premios de Temporada",       desc: "Vota por MVP, más mejorado y mejor actitud al final de la temporada." },
    } as Record<string, { emoji: string; title: string; desc: string }>,
  },
};

export default function CoachVotes({ initialVotes, locale }: { initialVotes: VoteData[]; locale: string }) {
  const c = locale === "es" ? CONTENT.es : CONTENT.en;
  const [votes, setVotes] = useState<VoteData[]>(initialVotes);
  const [pending, setPending] = useState<Set<string>>(new Set());

  async function handleToggle(slug: string) {
    if (pending.has(slug)) return;
    setPending((p) => new Set(p).add(slug));
    try {
      const res = await fetch("/api/vote/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        const data = await res.json();
        setVotes((v) => v.map((item) => item.slug === slug ? { ...item, coachVoted: data.coachVoted } : item));
      }
    } finally {
      setPending((p) => { const s = new Set(p); s.delete(slug); return s; });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1c1c1e] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--color-accent)] shadow-md flex-shrink-0">
              <Image src="/logo.jpg" alt="crest" width={32} height={32} className="object-cover" />
            </div>
            <span className="font-bold text-white text-sm">{c.heading}</span>
          </div>
          <div className="flex items-center gap-3">
            <AdminLangToggle locale={locale} />
            <a href="/admin/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">{c.backToDashboard}</a>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">{c.heading}</h1>
          <p className="text-sm text-gray-500 mt-1">{c.subheading}</p>
        </div>

        <div className="flex flex-col gap-3">
          {votes.map((item) => {
            const feature = c.features[item.slug];
            if (!feature) return null;
            return (
              <div key={item.slug} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex gap-3">
                <span className="text-2xl leading-none mt-0.5">{feature.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{feature.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{feature.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">{c.votes(item.communityCount)}</p>
                </div>
                <button
                  onClick={() => handleToggle(item.slug)}
                  disabled={pending.has(item.slug)}
                  className={`flex flex-col items-center gap-0.5 shrink-0 ml-1 rounded-lg px-3 py-2 transition-colors text-sm font-bold ${
                    item.coachVoted
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {item.coachVoted ? c.prioritized : c.markPriority}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
