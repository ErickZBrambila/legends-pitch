"use client";

import { useState } from "react";
import type { VoteData, Difficulty } from "@/lib/votes";

const LABELS: Record<string, { emoji: string; title: string }> = {
  "player-stats":        { emoji: "📊", title: "Player stats" },
  "attendance-tracking": { emoji: "✅", title: "Attendance tracking" },
  "season-awards":       { emoji: "🏆", title: "Season awards" },
};

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

export default function VotingDashboard({ initialVotes }: { initialVotes: VoteData[] }) {
  const [votes, setVotes] = useState<VoteData[]>(initialVotes);
  const [pending, setPending] = useState<Set<string>>(new Set());

  async function handleDifficulty(slug: string, difficulty: Difficulty) {
    if (pending.has(slug)) return;
    setPending((p) => new Set(p).add(slug));
    setVotes((v) => v.map((item) => item.slug === slug ? { ...item, difficulty } : item));

    try {
      await fetch("/api/vote/difficulty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, difficulty }),
      });
    } finally {
      setPending((p) => { const s = new Set(p); s.delete(slug); return s; });
    }
  }

  return (
    <section className="mb-10">
      <h2 className="text-base font-black text-gray-900 mb-4">Community + Coach Voting</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Feature</th>
              <th className="text-center px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Community</th>
              <th className="text-center px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Coach</th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {votes.map((item, i) => {
              const label = LABELS[item.slug];
              if (!label) return null;
              return (
                <tr key={item.slug} className={i < votes.length - 1 ? "border-b border-gray-50" : ""}>
                  <td className="px-4 py-3">
                    <span className="mr-2">{label.emoji}</span>
                    <span className="font-bold text-gray-900">{label.title}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-black text-gray-900">{item.communityCount}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.coachVoted
                      ? <span className="text-green-600 font-black">⭐ Yes</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d}
                          onClick={() => handleDifficulty(item.slug, item.difficulty === d ? null : d)}
                          disabled={pending.has(item.slug)}
                          className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                            item.difficulty === d
                              ? d === "Easy"   ? "bg-green-100 text-green-700"
                              : d === "Medium" ? "bg-yellow-100 text-yellow-700"
                              :                  "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
