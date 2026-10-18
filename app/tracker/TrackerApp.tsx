"use client";

import { useState, useEffect, useCallback } from "react";
import type { Player, Match, TrackerEvent, TrackerEventType, TrackerGame } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type TeamSlug = "u11" | "u12";
type Phase = "setup" | "live" | "halftime" | "end" | "submitted";

interface TeamData {
  players: Player[];
  matches: Match[];
}

interface Props {
  teams: { u11: TeamData; u12: TeamData };
}

interface GameState {
  phase: Phase;
  teamAgeGroup: TeamSlug | null;
  matchId: string;
  opponent: string;
  homeAway: "home" | "away";
  matchDate: string;
  half: 1 | 2;
  events: TrackerEvent[];
  gameStartWall: number | null;
  halfStartWall: number | null;
  gameId: string;
}

type ModalStep =
  | { type: "pick_scorer"; eventType: TrackerEventType }
  | { type: "pick_assister"; scorerId: string; scorerName: string }
  | { type: "pick_sub_out" }
  | { type: "pick_sub_in"; subOutId: string; subOutName: string }
  | { type: "pick_card_player"; eventType: "yellow_card" | "red_card" }
  | { type: "pick_shot_player"; eventType: "shot_on" | "shot_off" | "save" }
  | { type: "confirm_rival_goal" };

const DRAFT_KEY = "tracker_game_draft";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatClock(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function countGoals(events: TrackerEvent[]) {
  const home = events.filter((e) => e.type === "goal").length;
  const away = events.filter((e) => e.type === "rival_goal").length;
  return { home, away };
}

const EVENT_LABELS: Record<TrackerEventType, string> = {
  goal: "GOAL",
  rival_goal: "RIVAL GOAL",
  shot_on: "Shot On",
  shot_off: "Shot Off",
  save: "Save",
  yellow_card: "Yellow Card",
  red_card: "Red Card",
  substitution: "Sub",
};

const EVENT_EMOJI: Record<TrackerEventType, string> = {
  goal: "⚽",
  rival_goal: "⚽",
  shot_on: "🎯",
  shot_off: "❌",
  save: "🧤",
  yellow_card: "🟨",
  red_card: "🟥",
  substitution: "🔄",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrackerApp({ teams }: Props) {
  const [state, setState] = useState<GameState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const draft = JSON.parse(saved) as GameState;
          // Clock timestamps are stale after a tab restore — reset so the clock
          // starts from 0 for the current half. Events are preserved.
          if (draft.phase === "live") {
            draft.halfStartWall = Date.now();
          }
          return draft;
        }
      } catch {}
    }
    return {
      phase: "setup",
      teamAgeGroup: null,
      matchId: "",
      opponent: "",
      homeAway: "home",
      matchDate: "",
      half: 1,
      events: [],
      gameStartWall: null,
      halfStartWall: null,
      gameId: makeId(),
    };
  });

  const [now, setNow] = useState(Date.now());
  const [modal, setModal] = useState<ModalStep | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Clock tick
  useEffect(() => {
    if (state.phase !== "live") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.phase]);

  // Auto-save draft
  useEffect(() => {
    if (state.phase === "submitted") {
      localStorage.removeItem(DRAFT_KEY);
    } else {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    }
  }, [state]);

  const elapsedMs = state.halfStartWall ? now - state.halfStartWall : 0;
  const currentMinute = Math.floor(elapsedMs / 60000) + (state.half === 2 ? 45 : 0);

  const pushEvent = useCallback(
    (partial: Omit<TrackerEvent, "id" | "half" | "minute" | "wallTimestamp">) => {
      const event: TrackerEvent = {
        id: makeId(),
        half: state.half,
        minute: currentMinute,
        wallTimestamp: new Date().toISOString(),
        ...partial,
      };
      setState((s) => ({ ...s, events: [...s.events, event] }));
    },
    [state.half, currentMinute]
  );

  const undoLast = () => {
    setState((s) => ({ ...s, events: s.events.slice(0, -1) }));
  };

  const deleteEvent = useCallback((id: string) => {
    setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
  }, []);

  // ── Setup screen ─────────────────────────────────────────────────────────

  if (state.phase === "setup") {
    const teamData = state.teamAgeGroup ? teams[state.teamAgeGroup] : null;
    const futureMatches = teamData
      ? teamData.matches.filter((m) => m.result === null)
      : [];

    return (
      <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6 max-w-sm mx-auto w-full">
          <div className="text-center">
            <div className="text-4xl mb-2">⚽</div>
            <h1 className="text-2xl font-bold tracking-tight">Game Tracker</h1>
            <p className="text-[#8b949e] text-sm mt-1">North Legends FC</p>
          </div>

          {/* Team picker */}
          <div className="w-full space-y-2">
            <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Team</label>
            <div className="grid grid-cols-2 gap-2">
              {(["u11", "u12"] as TeamSlug[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setState((s) => ({ ...s, teamAgeGroup: t, matchId: "", opponent: "", matchDate: "" }))}
                  className={`py-3 rounded-lg font-bold text-sm transition-colors ${
                    state.teamAgeGroup === t
                      ? "bg-[#238636] text-white"
                      : "bg-[#161b22] text-[#8b949e] hover:bg-[#21262d]"
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Match picker */}
          {state.teamAgeGroup && (
            <div className="w-full space-y-2">
              <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Match</label>
              <select
                value={state.matchId}
                onChange={(e) => {
                  const match = futureMatches.find((m) => m.id === e.target.value);
                  setState((s) => ({
                    ...s,
                    matchId: e.target.value,
                    opponent: match?.opponent ?? "",
                    homeAway: match?.homeAway ?? "home",
                    matchDate: match?.date ?? "",
                  }));
                }}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-3 text-sm text-[#f0f6fc] focus:outline-none focus:border-[#388bfd]"
              >
                <option value="">Select a match…</option>
                {futureMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} vs {m.opponent} ({m.homeAway})
                  </option>
                ))}
                <option value="__custom__">Other / custom…</option>
              </select>

              {state.matchId === "__custom__" && (
                <input
                  type="text"
                  placeholder="Opponent name"
                  value={state.opponent}
                  onChange={(e) => setState((s) => ({ ...s, opponent: e.target.value }))}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-3 text-sm text-[#f0f6fc] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd]"
                />
              )}
            </div>
          )}

          {/* Start */}
          <button
            disabled={!state.teamAgeGroup || !state.opponent}
            onClick={() =>
              setState((s) => ({
                ...s,
                phase: "live",
                half: 1,
                gameStartWall: Date.now(),
                halfStartWall: Date.now(),
                gameId: makeId(),
              }))
            }
            className="w-full py-4 bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#21262d] disabled:text-[#484f58] rounded-lg font-bold text-lg transition-colors"
          >
            Start Game
          </button>

          {/* Resume draft hint */}
          {state.events.length > 0 && (
            <p className="text-[#8b949e] text-xs text-center">
              Draft restored · {state.events.length} event{state.events.length !== 1 ? "s" : ""} logged
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Live screen ──────────────────────────────────────────────────────────

  if (state.phase === "live") {
    const { home, away } = countGoals(state.events);
    const teamData = teams[state.teamAgeGroup!];
    const players = teamData.players;

    // Resolve modal
    const closeModal = () => setModal(null);

    const handleEventTap = (eventType: TrackerEventType) => {
      if (eventType === "rival_goal") {
        setModal({ type: "confirm_rival_goal" });
      } else if (eventType === "goal") {
        setModal({ type: "pick_scorer", eventType });
      } else if (eventType === "substitution") {
        setModal({ type: "pick_sub_out" });
      } else if (eventType === "yellow_card" || eventType === "red_card") {
        setModal({ type: "pick_card_player", eventType });
      } else {
        setModal({ type: "pick_shot_player", eventType: eventType as "shot_on" | "shot_off" | "save" });
      }
    };

    const recentEvents = [...state.events].reverse().slice(0, 8);

    return (
      <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc] flex flex-col select-none">
        {/* Scoreboard */}
        <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <div className="text-center flex-1">
              <div className="text-xs text-[#8b949e] uppercase tracking-wider truncate">Legends</div>
              <div className="text-5xl font-black tabular-nums text-[#3fb950]">{home}</div>
            </div>
            <div className="text-center px-4">
              <div className={`text-xs font-bold px-2 py-0.5 rounded ${state.half === 1 ? "bg-[#238636]/20 text-[#3fb950]" : "bg-[#388bfd]/20 text-[#388bfd]"}`}>
                H{state.half}
              </div>
              <div className="text-2xl font-mono font-bold mt-1">{formatClock(elapsedMs)}</div>
              <div className="text-xs text-[#8b949e]">{`${currentMinute}'`}</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-xs text-[#8b949e] uppercase tracking-wider truncate">{state.opponent}</div>
              <div className="text-5xl font-black tabular-nums text-[#f85149]">{away}</div>
            </div>
          </div>
        </div>

        {/* Event buttons */}
        <div className="flex-1 overflow-y-auto px-3 py-4 max-w-sm mx-auto w-full space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleEventTap("goal")}
              className="col-span-2 py-5 bg-[#238636] hover:bg-[#2ea043] active:scale-95 rounded-xl font-black text-xl tracking-wide transition-all"
            >
              ⚽ GOAL
            </button>
            <button
              onClick={() => handleEventTap("rival_goal")}
              className="py-4 bg-[#da3633]/20 hover:bg-[#da3633]/30 active:scale-95 border border-[#da3633]/40 rounded-xl font-bold text-[#f85149] transition-all"
            >
              ⚽ Rival Goal
            </button>
            <button
              onClick={() => handleEventTap("shot_on")}
              className="py-4 bg-[#161b22] hover:bg-[#21262d] active:scale-95 border border-[#30363d] rounded-xl font-semibold transition-all"
            >
              🎯 Shot On
            </button>
            <button
              onClick={() => handleEventTap("shot_off")}
              className="py-4 bg-[#161b22] hover:bg-[#21262d] active:scale-95 border border-[#30363d] rounded-xl font-semibold transition-all"
            >
              ❌ Shot Off
            </button>
            <button
              onClick={() => handleEventTap("save")}
              className="py-4 bg-[#161b22] hover:bg-[#21262d] active:scale-95 border border-[#30363d] rounded-xl font-semibold transition-all"
            >
              🧤 Save
            </button>
            <button
              onClick={() => handleEventTap("yellow_card")}
              className="py-4 bg-[#bb8009]/20 hover:bg-[#bb8009]/30 active:scale-95 border border-[#bb8009]/40 rounded-xl font-semibold text-[#d29922] transition-all"
            >
              🟨 Yellow
            </button>
            <button
              onClick={() => handleEventTap("red_card")}
              className="py-4 bg-[#da3633]/20 hover:bg-[#da3633]/30 active:scale-95 border border-[#da3633]/40 rounded-xl font-semibold text-[#f85149] transition-all"
            >
              🟥 Red Card
            </button>
            <button
              onClick={() => handleEventTap("substitution")}
              className="col-span-2 py-3 bg-[#161b22] hover:bg-[#21262d] active:scale-95 border border-[#30363d] rounded-xl font-semibold transition-all"
            >
              🔄 Substitution
            </button>
          </div>

          {/* Control row */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={undoLast}
              disabled={state.events.length === 0}
              className="py-2.5 bg-[#161b22] hover:bg-[#21262d] disabled:opacity-30 border border-[#30363d] rounded-lg text-sm font-medium transition-all"
            >
              ↩ Undo
            </button>
            <button
              onClick={() => setState((s) => ({ ...s, phase: "halftime" }))}
              className="py-2.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded-lg text-sm font-medium transition-all"
            >
              Half Time
            </button>
            <button
              onClick={() => setState((s) => ({ ...s, phase: "end" }))}
              className="py-2.5 bg-[#da3633]/20 hover:bg-[#da3633]/30 border border-[#da3633]/40 rounded-lg text-sm font-semibold text-[#f85149] transition-all"
            >
              End Game
            </button>
          </div>

          {/* Recent events feed */}
          {recentEvents.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-[#8b949e] uppercase tracking-wider mb-1">Recent</div>
              {recentEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-[#21262d]">
                  <span className="text-xs font-mono text-[#8b949e] w-8">{e.minute}&apos;</span>
                  <span>{EVENT_EMOJI[e.type]}</span>
                  <span className={`flex-1 ${e.type === "rival_goal" ? "text-[#f85149]" : ""}`}>
                    {e.playerName ?? EVENT_LABELS[e.type]}
                    {e.assistPlayerName && <span className="text-[#8b949e]"> ({e.assistPlayerName})</span>}
                    {e.subInPlayerName && <span className="text-[#8b949e]"> → {e.subInPlayerName}</span>}
                  </span>
                  <button
                    onClick={() => deleteEvent(e.id)}
                    className="text-[#484f58] hover:text-[#f85149] transition-colors px-1 py-0.5 text-xs"
                    aria-label="Delete event"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {modal && (
          <PlayerModal
            modal={modal}
            players={players}
            onClose={closeModal}
            onCommit={(event) => {
              pushEvent(event);
              closeModal();
            }}
            onNext={(next) => setModal(next)}
          />
        )}
      </div>
    );
  }

  // ── Halftime screen ───────────────────────────────────────────────────────

  if (state.phase === "halftime") {
    const { home, away } = countGoals(state.events);
    const h1Events = state.events.filter((e) => e.half === 1);

    return (
      <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc] flex flex-col items-center justify-center px-4 py-8 max-w-sm mx-auto gap-6">
        <div className="text-center">
          <div className="text-xs font-bold text-[#388bfd] uppercase tracking-widest mb-2">Half Time</div>
          <div className="text-6xl font-black">{home} – {away}</div>
          <div className="text-[#8b949e] mt-1 text-sm">Legends vs {state.opponent}</div>
        </div>

        <div className="w-full bg-[#161b22] rounded-xl p-4 space-y-2">
          <div className="text-xs text-[#8b949e] uppercase tracking-wider mb-2">First Half</div>
          {h1Events.length === 0 && <p className="text-[#484f58] text-sm">No events logged</p>}
          {h1Events.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-sm">
              <span className="font-mono text-[#8b949e] w-7">{e.minute}&apos;</span>
              <span>{EVENT_EMOJI[e.type]}</span>
              <span>{e.playerName ?? EVENT_LABELS[e.type]}</span>
              {e.assistPlayerName && <span className="text-[#8b949e]">({e.assistPlayerName})</span>}
            </div>
          ))}
        </div>

        <button
          onClick={() =>
            setState((s) => ({ ...s, phase: "live", half: 2, halfStartWall: Date.now() }))
          }
          className="w-full py-4 bg-[#238636] hover:bg-[#2ea043] rounded-xl font-bold text-lg transition-colors"
        >
          Start Second Half
        </button>
      </div>
    );
  }

  // ── End / review screen ───────────────────────────────────────────────────

  if (state.phase === "end") {
    const { home, away } = countGoals(state.events);
    const scorers = state.events.filter((e) => e.type === "goal");
    const cards = state.events.filter((e) => e.type === "yellow_card" || e.type === "red_card");
    const subs = state.events.filter((e) => e.type === "substitution");

    const handleSubmit = async () => {
      setSubmitting(true);
      setSubmitError("");
      const game: TrackerGame = {
        gameId: state.gameId,
        teamAgeGroup: state.teamAgeGroup!,
        matchId: state.matchId,
        opponent: state.opponent,
        homeAway: state.homeAway,
        date: state.matchDate || new Date().toISOString().split("T")[0],
        submittedAt: new Date().toISOString(),
        events: state.events,
        finalScore: { home, away },
      };
      try {
        const res = await fetch("/api/tracker/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(game),
        });
        if (!res.ok) throw new Error("Server error");
        setState((s) => ({ ...s, phase: "submitted" }));
      } catch {
        setSubmitError("Failed to submit — check connection and try again.");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc] flex flex-col px-4 py-8 max-w-sm mx-auto gap-5">
        <div className="text-center">
          <div className="text-xs font-bold text-[#3fb950] uppercase tracking-widest mb-2">Full Time</div>
          <div className="text-6xl font-black">{home} – {away}</div>
          <div className="text-[#8b949e] mt-1">Legends vs {state.opponent}</div>
        </div>

        {/* Goals */}
        {scorers.length > 0 && (
          <StatBlock title="Goals">
            {scorers.map((e) => (
              <div key={e.id} className="flex gap-2 text-sm">
                <span className="font-mono text-[#8b949e] w-7">{e.minute}&apos;</span>
                <span>⚽ {e.playerName}</span>
                {e.assistPlayerName && <span className="text-[#8b949e]">({e.assistPlayerName})</span>}
              </div>
            ))}
          </StatBlock>
        )}

        {/* Full log */}
        <StatBlock title={`All Events (${state.events.length})`}>
          {state.events.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-sm py-0.5">
              <span className="font-mono text-[#8b949e] w-7">{e.minute}&apos;</span>
              <span className="text-xs text-[#484f58]">H{e.half}</span>
              <span>{EVENT_EMOJI[e.type]}</span>
              <span className={`flex-1 ${e.type === "rival_goal" ? "text-[#f85149]" : ""}`}>
                {e.playerName ?? EVENT_LABELS[e.type]}
                {e.assistPlayerName && <span className="text-[#8b949e]"> ({e.assistPlayerName})</span>}
                {e.subInPlayerName && <span className="text-[#8b949e]"> → {e.subInPlayerName}</span>}
              </span>
              <button
                onClick={() => deleteEvent(e.id)}
                className="text-[#484f58] hover:text-[#f85149] transition-colors px-1 py-0.5 text-xs flex-shrink-0"
                aria-label="Delete event"
              >
                ✕
              </button>
            </div>
          ))}
        </StatBlock>

        {cards.length > 0 && (
          <StatBlock title="Discipline">
            {cards.map((e) => (
              <div key={e.id} className="flex gap-2 text-sm">
                <span className="font-mono text-[#8b949e] w-7">{e.minute}&apos;</span>
                <span>{EVENT_EMOJI[e.type]} {e.playerName}</span>
              </div>
            ))}
          </StatBlock>
        )}

        {subs.length > 0 && (
          <StatBlock title="Substitutions">
            {subs.map((e) => (
              <div key={e.id} className="flex gap-2 text-sm">
                <span className="font-mono text-[#8b949e] w-7">{e.minute}&apos;</span>
                <span>🔄 {e.playerName} → {e.subInPlayerName}</span>
              </div>
            ))}
          </StatBlock>
        )}

        {submitError && (
          <p className="text-[#f85149] text-sm text-center">{submitError}</p>
        )}

        <div className="space-y-2 pb-4">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#21262d] disabled:text-[#484f58] rounded-xl font-bold text-lg transition-colors"
          >
            {submitting ? "Submitting…" : "Submit Game Stats"}
          </button>
          <button
            onClick={() => setState((s) => ({ ...s, phase: "live" }))}
            className="w-full py-3 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded-xl text-sm font-medium transition-colors"
          >
            ← Back to Game
          </button>
        </div>
      </div>
    );
  }

  // ── Submitted screen ─────────────────────────────────────────────────────

  if (state.phase === "submitted") {
    const { home, away } = countGoals(state.events);
    return (
      <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc] flex flex-col items-center justify-center px-4 text-center gap-5">
        <div className="text-5xl">✅</div>
        <div>
          <h2 className="text-2xl font-bold">Stats saved!</h2>
          <p className="text-[#8b949e] mt-1">Final: Legends {home} – {away} {state.opponent}</p>
        </div>
        <p className="text-[#8b949e] text-sm max-w-xs">
          Download the JSON from the admin page and share the summary with coaches.
        </p>
        <button
          onClick={() =>
            setState({
              phase: "setup",
              teamAgeGroup: null,
              matchId: "",
              opponent: "",
              homeAway: "home",
              matchDate: "",
              half: 1,
              events: [],
              gameStartWall: null,
              halfStartWall: null,
              gameId: makeId(),
            })
          }
          className="py-3 px-6 bg-[#238636] hover:bg-[#2ea043] rounded-xl font-bold transition-colors"
        >
          Track Another Game
        </button>
      </div>
    );
  }

  return null;
}

// ─── Stat block ───────────────────────────────────────────────────────────────

function StatBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#161b22] rounded-xl p-4 space-y-1.5">
      <div className="text-xs text-[#8b949e] uppercase tracking-wider mb-2">{title}</div>
      {children}
    </div>
  );
}

// ─── Player picker modal ──────────────────────────────────────────────────────

interface ModalProps {
  modal: ModalStep;
  players: Player[];
  onClose: () => void;
  onCommit: (event: Omit<TrackerEvent, "id" | "half" | "minute" | "wallTimestamp">) => void;
  onNext: (step: ModalStep) => void;
}

function PlayerModal({ modal, players, onClose, onCommit, onNext }: ModalProps) {
  const sorted = [...players].sort((a, b) => a.number - b.number);

  if (modal.type === "confirm_rival_goal") {
    return (
      <ModalShell title="Rival Goal?" onClose={onClose}>
        <button
          onClick={() => onCommit({ type: "rival_goal" })}
          className="w-full py-4 bg-[#da3633]/20 hover:bg-[#da3633]/30 border border-[#da3633]/40 rounded-xl font-bold text-[#f85149] text-lg transition-all"
        >
          ⚽ Confirm Rival Goal
        </button>
      </ModalShell>
    );
  }

  if (modal.type === "pick_scorer") {
    return (
      <ModalShell title="Who scored?" onClose={onClose}>
        <PlayerList
          players={sorted}
          onSelect={(p) => onNext({ type: "pick_assister", scorerId: p.id, scorerName: p.name })}
        />
      </ModalShell>
    );
  }

  if (modal.type === "pick_assister") {
    return (
      <ModalShell title="Assisted by? (optional)" onClose={onClose}>
        <button
          onClick={() => onCommit({ type: "goal", playerId: modal.scorerId, playerName: modal.scorerName })}
          className="w-full py-3 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded-lg text-sm font-medium transition-all mb-2"
        >
          No assist
        </button>
        <PlayerList
          players={sorted.filter((p) => p.id !== modal.scorerId)}
          onSelect={(p) =>
            onCommit({
              type: "goal",
              playerId: modal.scorerId,
              playerName: modal.scorerName,
              assistPlayerId: p.id,
              assistPlayerName: p.name,
            })
          }
        />
      </ModalShell>
    );
  }

  if (modal.type === "pick_card_player") {
    return (
      <ModalShell title={modal.eventType === "yellow_card" ? "🟨 Yellow card — who?" : "🟥 Red card — who?"} onClose={onClose}>
        <PlayerList
          players={sorted}
          onSelect={(p) => onCommit({ type: modal.eventType, playerId: p.id, playerName: p.name })}
        />
      </ModalShell>
    );
  }

  if (modal.type === "pick_shot_player") {
    const labels: Record<string, string> = { shot_on: "🎯 Shot On", shot_off: "❌ Shot Off", save: "🧤 Save" };
    return (
      <ModalShell title={`${labels[modal.eventType]} — who?`} onClose={onClose}>
        <button
          onClick={() => onCommit({ type: modal.eventType })}
          className="w-full py-3 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded-lg text-sm font-medium transition-all mb-2"
        >
          Skip / unknown
        </button>
        <PlayerList
          players={sorted}
          onSelect={(p) => onCommit({ type: modal.eventType, playerId: p.id, playerName: p.name })}
        />
      </ModalShell>
    );
  }

  if (modal.type === "pick_sub_out") {
    return (
      <ModalShell title="Coming off?" onClose={onClose}>
        <PlayerList
          players={sorted}
          onSelect={(p) => onNext({ type: "pick_sub_in", subOutId: p.id, subOutName: p.name })}
        />
      </ModalShell>
    );
  }

  if (modal.type === "pick_sub_in") {
    return (
      <ModalShell title="Coming on?" onClose={onClose}>
        <PlayerList
          players={sorted.filter((p) => p.id !== modal.subOutId)}
          onSelect={(p) =>
            onCommit({
              type: "substitution",
              playerId: modal.subOutId,
              playerName: modal.subOutName,
              subInPlayerId: p.id,
              subInPlayerName: p.name,
            })
          }
        />
      </ModalShell>
    );
  }

  return null;
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60" onClick={onClose}>
      <div
        className="bg-[#161b22] rounded-t-2xl px-4 pt-4 pb-8 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-base">{title}</h3>
          <button onClick={onClose} className="text-[#8b949e] text-xl px-1">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PlayerList({ players, onSelect }: { players: Player[]; onSelect: (p: Player) => void }) {
  return (
    <div className="space-y-1.5">
      {players.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className="w-full flex items-center gap-3 py-3 px-3 bg-[#21262d] hover:bg-[#30363d] active:scale-95 rounded-lg transition-all text-left"
        >
          <span className="font-mono text-[#8b949e] text-sm w-6 text-right">{p.number}</span>
          <span className="font-semibold">{p.name}</span>
          <span className="text-[#8b949e] text-xs ml-auto">{p.position}</span>
        </button>
      ))}
    </div>
  );
}
