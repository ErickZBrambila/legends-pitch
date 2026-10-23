"use client";

import { useState } from "react";
import Link from "next/link";
import AdminBreadcrumb from "@/components/AdminBreadcrumb";
import type { TrackerGame, TrackerEvent, TrackerEventType } from "@/lib/types";

interface Props {
  initialGames: TrackerGame[];
}

const EVENT_EMOJI: Record<TrackerEventType, string> = {
  goal: "⚽",
  rival_goal: "⚽",
  shot_on: "🎯",
  shot_off: "❌",
  save: "🧤",
  corner: "🚩",
  yellow_card: "🟨",
  red_card: "🟥",
  substitution: "🔄",
};

function downloadJson(game: TrackerGame) {
  const blob = new Blob([JSON.stringify(game, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kickreel-${game.date}-vs-${game.opponent.replace(/\s+/g, "_")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function GameStats({ game }: { game: TrackerGame }) {
  const goals = game.events.filter((e) => e.type === "goal");
  const shotsOn = game.events.filter((e) => e.type === "shot_on").length;
  const shotsOff = game.events.filter((e) => e.type === "shot_off").length;
  const saves = game.events.filter((e) => e.type === "save").length;
  const yellows = game.events.filter((e) => e.type === "yellow_card");
  const reds = game.events.filter((e) => e.type === "red_card");
  const subs = game.events.filter((e) => e.type === "substitution");

  // Goal scorers tally
  const scorerMap: Record<string, number> = {};
  goals.forEach((e) => {
    if (e.playerName) scorerMap[e.playerName] = (scorerMap[e.playerName] ?? 0) + 1;
  });
  const assistMap: Record<string, number> = {};
  goals.forEach((e) => {
    if (e.assistPlayerName) assistMap[e.assistPlayerName] = (assistMap[e.assistPlayerName] ?? 0) + 1;
  });

  return (
    <div className="space-y-4 text-sm">
      {/* Score summary */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Goals For" value={game.finalScore.home} highlight />
        <Stat label="Goals Against" value={game.finalScore.away} />
        <Stat label="Shots" value={shotsOn + shotsOff + goals.length} />
        <Stat label="On Target" value={shotsOn + goals.length} />
        <Stat label="Saves" value={saves} />
        <Stat label="Events" value={game.events.length} />
      </div>

      {/* Goal scorers */}
      {goals.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Scorers</h4>
          <div className="space-y-1">
            {goals.map((e) => (
              <div key={e.id} className="flex items-center gap-2">
                <span className="font-mono text-gray-400 text-xs w-7">{e.minute}&apos;</span>
                <span>⚽</span>
                <span className="font-medium">{e.playerName ?? "Unknown"}</span>
                {e.assistPlayerName && (
                  <span className="text-gray-500">(assist: {e.assistPlayerName})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal scorers tally */}
      {Object.keys(scorerMap).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(scorerMap)
            .sort(([, a], [, b]) => b - a)
            .map(([name, count]) => (
              <span key={name} className="bg-green-50 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                {name} {count > 1 ? `×${count}` : ""}
              </span>
            ))}
          {Object.entries(assistMap)
            .sort(([, a], [, b]) => b - a)
            .map(([name, count]) => (
              <span key={name} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                {name} {count > 1 ? `×${count}` : ""} ast
              </span>
            ))}
        </div>
      )}

      {/* Discipline */}
      {(yellows.length > 0 || reds.length > 0) && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Discipline</h4>
          <div className="space-y-1">
            {[...yellows, ...reds].map((e) => (
              <div key={e.id} className="flex items-center gap-2">
                <span className="font-mono text-gray-400 text-xs w-7">{e.minute}&apos;</span>
                <span>{EVENT_EMOJI[e.type]}</span>
                <span>{e.playerName ?? "Unknown"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Substitutions */}
      {subs.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Substitutions</h4>
          <div className="space-y-1">
            {subs.map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-gray-600">
                <span className="font-mono text-gray-400 text-xs w-7">{e.minute}&apos;</span>
                <span>🔄</span>
                <span>{e.playerName}</span>
                <span className="text-gray-400">→</span>
                <span>{e.subInPlayerName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full event log */}
      <details className="group">
        <summary className="text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none">
          Full event log ({game.events.length})
        </summary>
        <div className="mt-2 space-y-0.5 max-h-64 overflow-y-auto border border-gray-100 rounded-lg p-3 font-mono text-xs bg-gray-50">
          {game.events.map((e) => (
            <div key={e.id} className="flex gap-2 text-gray-600">
              <span className="text-gray-400 w-6">{e.minute}&apos;</span>
              <span className="text-gray-400">H{e.half}</span>
              <span>{EVENT_EMOJI[e.type]}</span>
              <span>{e.playerName ?? e.type}</span>
              {e.assistPlayerName && <span className="text-gray-400">({e.assistPlayerName})</span>}
              {e.subInPlayerName && <span className="text-gray-400">→ {e.subInPlayerName}</span>}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? "bg-green-50" : "bg-gray-50"}`}>
      <div className={`text-2xl font-black ${highlight ? "text-green-700" : "text-gray-800"}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

export default function KickReelAdmin({ initialGames }: Props) {
  const [games, setGames] = useState<TrackerGame[]>(initialGames);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<Record<string, string>>({});

  const handleDelete = async (gameId: string) => {
    if (!confirm("Delete this game from the stats archive?")) return;
    setDeleting(gameId);
    try {
      const res = await fetch(`/api/tracker/games/${gameId}`, { method: "DELETE" });
      if (res.ok) setGames((g) => g.filter((x) => x.gameId !== gameId));
    } finally {
      setDeleting(null);
    }
  };

  const handleApply = async (game: TrackerGame) => {
    if (!game.matchId || game.matchId === "__custom__") {
      setApplyResult((r) => ({ ...r, [game.gameId]: "No linked match — select from the schedule next time." }));
      return;
    }
    setApplying(game.gameId);
    try {
      const res = await fetch("/api/admin/kickreel/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: game.matchId,
          homeAway: game.homeAway,
          homeGoals: game.finalScore.home,
          awayGoals: game.finalScore.away,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplyResult((r) => ({ ...r, [game.gameId]: `Applied to match — result: ${data.result}` }));
      } else {
        setApplyResult((r) => ({ ...r, [game.gameId]: "Failed to apply." }));
      }
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <AdminBreadcrumb crumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "KickReel Stats" }]} />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KickReel Stats</h1>
            <p className="text-gray-500 text-sm mt-0.5">Submitted game tracking sessions</p>
          </div>
          <Link
            href="/tracker"
            target="_blank"
            className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            Open Tracker ↗
          </Link>
        </div>

        {games.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">⚽</div>
            <p className="font-medium">No games submitted yet</p>
            <p className="text-sm mt-1">Open the tracker on the sideline and submit a game to see it here.</p>
          </div>
        )}

        <div className="space-y-4">
          {games.map((game) => {
            const isExpanded = expanded === game.gameId;
            const result =
              game.finalScore.home > game.finalScore.away
                ? "W"
                : game.finalScore.home < game.finalScore.away
                ? "L"
                : "D";
            const resultColor = result === "W" ? "text-green-700 bg-green-50" : result === "L" ? "text-red-700 bg-red-50" : "text-gray-600 bg-gray-100";

            return (
              <div key={game.gameId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Card header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${resultColor}`}>{result}</span>
                        <span className="text-xs text-gray-400 uppercase tracking-wide">{game.teamAgeGroup}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(game.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="font-bold text-lg text-gray-900">
                          Legends {game.finalScore.home} – {game.finalScore.away} {game.opponent}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {game.homeAway === "home" ? "Home" : "Away"} · {game.events.length} events logged
                      </div>
                    </div>

                    <button
                      onClick={() => setExpanded(isExpanded ? null : game.gameId)}
                      className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium flex-shrink-0"
                    >
                      {isExpanded ? "Hide ▲" : "Stats ▼"}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => downloadJson(game)}
                      className="text-xs bg-gray-900 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      ↓ JSON
                    </button>
                    <button
                      onClick={() => handleApply(game)}
                      disabled={applying === game.gameId}
                      className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      {applying === game.gameId ? "Applying…" : "Apply to Match"}
                    </button>
                    <button
                      onClick={() => handleDelete(game.gameId)}
                      disabled={deleting === game.gameId}
                      className="text-xs text-red-600 hover:text-red-800 disabled:opacity-40 px-2 py-1.5 font-medium transition-colors ml-auto"
                    >
                      {deleting === game.gameId ? "Deleting…" : "Delete"}
                    </button>
                  </div>

                  {applyResult[game.gameId] && (
                    <p className="text-xs mt-2 text-blue-700">{applyResult[game.gameId]}</p>
                  )}
                </div>

                {/* Expanded stats */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                    <GameStats game={game} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
