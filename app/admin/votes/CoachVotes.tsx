"use client";

import { useState } from "react";
import type { VoteData } from "@/lib/votes";

const LABELS: Record<string, { emoji: string; title: string }> = {
  "player-stats":        { emoji: "📊", title: "Player stats" },
  "attendance-tracking": { emoji: "✅", title: "Attendance tracking" },
  "season-awards":       { emoji: "🏆", title: "Season awards" },
};

export default function CoachVotes({ initialVotes }: { initialVotes: VoteData[] }) {
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
    <div className="flex flex-col gap-3">
      {votes.map((item) => {
        const label = LABELS[item.slug];
        if (!label) return null;
        return (
          <div key={item.slug} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <span className="text-2xl leading-none">{label.emoji}</span>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">{label.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.communityCount} community vote{item.communityCount !== 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={() => handleToggle(item.slug)}
              disabled={pending.has(item.slug)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                item.coachVoted
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {item.coachVoted ? "⭐ Priority" : "Mark priority"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
