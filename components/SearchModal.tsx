"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { SearchResult } from "@/app/api/search/route";

const TYPE_LABEL: Record<SearchResult["type"], string> = {
  news: "News",
  announcement: "Announcement",
  match: "Schedule",
  player: "Roster",
};

const TYPE_ICON: Record<SearchResult["type"], string> = {
  news: "📰",
  announcement: "📣",
  match: "⚽",
  player: "👤",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close on route change
  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setCursor(0);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  const go = useCallback((href: string) => {
    router.push(href);
    onClose();
  }, [router, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
      if (e.key === "Enter" && results[cursor]) { go(results[cursor].href); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, cursor, go, onClose]);

  if (!open) return null;

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  // Flat index for cursor tracking
  const flat = results;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-[#1c1c2e] rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players, news, schedule…"
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-base outline-none"
          />
          {loading && (
            <svg className="w-4 h-4 text-gray-500 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          <kbd className="hidden sm:inline text-xs text-gray-600 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">Esc</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {(["news", "announcement", "match", "player"] as SearchResult["type"][]).map((type) => {
              const group = grouped[type];
              if (!group?.length) return null;
              return (
                <div key={type}>
                  <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-widest uppercase text-gray-500">
                    {TYPE_LABEL[type]}
                  </p>
                  {group.map((r) => {
                    const idx = flat.indexOf(r);
                    return (
                      <button
                        key={r.id}
                        onClick={() => go(r.href)}
                        onMouseEnter={() => setCursor(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          cursor === idx ? "bg-[var(--color-accent)]/15" : "hover:bg-white/5"
                        }`}
                      >
                        <span className="text-lg">{TYPE_ICON[type]}</span>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${cursor === idx ? "text-[var(--color-accent)]" : "text-white"}`}>
                            {r.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {r.subtitle}
                            {" · "}
                            <span className="uppercase">{r.team}</span>
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Hint footer */}
        {results.length > 0 && (
          <div className="px-4 py-2.5 border-t border-white/10 flex gap-4 text-[11px] text-gray-600">
            <span><kbd className="bg-white/5 px-1 rounded">↑↓</kbd> navigate</span>
            <span><kbd className="bg-white/5 px-1 rounded">↵</kbd> open</span>
            <span><kbd className="bg-white/5 px-1 rounded">Esc</kbd> close</span>
          </div>
        )}
      </div>
    </div>
  );
}
