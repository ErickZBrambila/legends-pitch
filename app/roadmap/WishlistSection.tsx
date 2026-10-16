"use client";

import { useState, useEffect } from "react";
import type { VoteData } from "@/lib/votes";

const STORAGE_KEY = "nlfc_voted_slugs";

function getLocalVotes(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLocalVotes(votes: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...votes]));
}

interface WishlistItem {
  slug: string;
  emoji: string;
  title: string;
  desc: string;
}

interface Props {
  badge: string;
  title: string;
  items: WishlistItem[];
  initialVotes: VoteData[];
}

export default function WishlistSection({ badge, title, items, initialVotes }: Props) {
  const [votes, setVotes] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialVotes.map((v) => [v.slug, v.communityCount]))
  );
  const [localVotes, setLocalVotes] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalVotes(getLocalVotes());
  }, []);

  async function handleVote(slug: string) {
    if (pending.has(slug)) return;
    const optimisticVoted = localVotes.has(slug);

    setPending((p) => new Set(p).add(slug));
    // Optimistic update
    setVotes((v) => ({ ...v, [slug]: Math.max(0, v[slug] + (optimisticVoted ? -1 : 1)) }));

    try {
      const res = await fetch("/api/vote/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }), // server is authoritative — no hasVoted
      });
      if (res.ok) {
        const data = await res.json();
        // Sync count and voted state from server
        setVotes((v) => ({ ...v, [slug]: data.communityCount }));
        const next = new Set(localVotes);
        if (data.hasVoted) next.add(slug); else next.delete(slug);
        setLocalVotes(next);
        saveLocalVotes(next);
      } else {
        // Revert optimistic update on server error
        setVotes((v) => ({ ...v, [slug]: Math.max(0, v[slug] + (optimisticVoted ? 1 : -1)) }));
      }
    } catch {
      setVotes((v) => ({ ...v, [slug]: Math.max(0, v[slug] + (optimisticVoted ? 1 : -1)) }));
    } finally {
      setPending((p) => { const s = new Set(p); s.delete(slug); return s; });
    }
  }

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">{badge}</span>
        <h2 className="text-lg font-black text-gray-900">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const voted = localVotes.has(item.slug);
          const count = votes[item.slug] ?? 0;
          return (
            <div key={item.slug} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex gap-3">
              <span className="text-2xl leading-none mt-0.5">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm">{item.title}</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
              <button
                onClick={() => handleVote(item.slug)}
                disabled={pending.has(item.slug)}
                className={`flex flex-col items-center gap-0.5 shrink-0 ml-1 rounded-lg px-2 py-1.5 transition-colors ${
                  voted
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
                aria-label={voted ? "Remove vote" : "Vote for this feature"}
              >
                <span className="text-base leading-none">👍</span>
                <span className="text-[11px] font-bold leading-none">{count}</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
