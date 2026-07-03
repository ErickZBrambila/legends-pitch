"use client";

import { useState } from "react";
import type { Player } from "@/lib/types";

const FORMATIONS: Record<string, { DEF: number; MID: number; FWD: number }> = {
  "4-3-3": { DEF: 4, MID: 3, FWD: 3 },
  "4-4-2": { DEF: 4, MID: 4, FWD: 2 },
  "3-4-3": { DEF: 3, MID: 4, FWD: 3 },
  "3-5-2": { DEF: 3, MID: 5, FWD: 2 },
};

type Pos = Player["position"];

function getFormationLabel(players: Player[]): string {
  const def = players.filter((p) => p.position === "DEF").length;
  const mid = players.filter((p) => p.position === "MID").length;
  const fwd = players.filter((p) => p.position === "FWD").length;
  return `${def}-${mid}-${fwd}`;
}

const POS_BADGE_COLOR: Record<Pos, string> = {
  GK:  "text-yellow-700 bg-yellow-50",
  DEF: "text-blue-700 bg-blue-50",
  MID: "text-green-700 bg-green-50",
  FWD: "text-red-700 bg-red-50",
};

function FieldPlayerToken({
  player, isSelected, onToggle, onMove,
}: {
  player: Player; isSelected: boolean; onToggle: () => void; onMove: (pos: Pos) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1 relative select-none" style={{ width: "clamp(48px, 14%, 68px)" }}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`rounded-full bg-[#1c1c1e] flex items-center justify-center shadow-lg transition-all duration-150
          ${isSelected
            ? "border-2 border-white scale-110 ring-2 ring-white/30"
            : "border-2 border-[#d4af37] hover:border-white hover:scale-105"
          }`}
        style={{ width: "clamp(38px, 11%, 54px)", height: "clamp(38px, 11%, 54px)" }}
      >
        <span className="font-black text-[#d4af37]" style={{ fontSize: "clamp(11px, 2.5vw, 17px)" }}>
          {player.number}
        </span>
      </button>
      <span className="text-white font-bold text-center leading-tight drop-shadow" style={{ fontSize: "clamp(8px, 1.8vw, 11px)" }}>
        {player.name}
      </span>
      {isSelected && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-[#1c1c1e] border border-[#d4af37]/50 rounded-xl p-1.5 shadow-2xl flex gap-1 whitespace-nowrap">
          {(["GK", "DEF", "MID", "FWD"] as const).map((pos) => (
            <button
              key={pos}
              onClick={(e) => { e.stopPropagation(); onMove(pos); }}
              className={`text-[9px] px-2 py-1 rounded-md font-black transition-colors ${
                player.position === pos ? "bg-[#d4af37] text-[#1c1c1e]" : "text-white/70 hover:bg-white/15 hover:text-white"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BenchCard({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white border border-gray-100 shadow-sm">
      <div className="w-7 h-7 rounded-full bg-[#1c1c1e] border border-[#d4af37]/60 flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-black text-[#d4af37]">{player.number}</span>
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-800 truncate">{player.name}</div>
        <span className={`text-[9px] font-bold px-1.5 rounded ${POS_BADGE_COLOR[player.position]}`}>
          {player.position}
        </span>
      </div>
    </div>
  );
}

const ROWS: { key: Pos; top: string }[] = [
  { key: "FWD", top: "20%" },
  { key: "MID", top: "40%" },
  { key: "DEF", top: "60%" },
  { key: "GK",  top: "79%" },
];

export default function AdminRosterField({ initialPlayers }: { initialPlayers: Player[] }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [startersCount, setStartersCount] = useState(11);

  // Starters = first N sorted by jersey number; bench = the rest
  const sorted = [...players].sort((a, b) => a.number - b.number);
  const starterSet = new Set(sorted.slice(0, startersCount).map((p) => p.id));
  const starters = sorted.filter((p) => starterSet.has(p.id));
  const bench = sorted.filter((p) => !starterSet.has(p.id));

  const grouped: Record<Pos, Player[]> = {
    FWD: starters.filter((p) => p.position === "FWD"),
    MID: starters.filter((p) => p.position === "MID"),
    DEF: starters.filter((p) => p.position === "DEF"),
    GK:  starters.filter((p) => p.position === "GK"),
  };

  const formation = getFormationLabel(starters);
  const activeFormation = FORMATIONS[formation] ? formation : null;

  function applyFormation(name: string) {
    const preset = FORMATIONS[name];
    const gks = starters.filter((p) => p.position === "GK");
    const field = starters.filter((p) => p.position !== "GK").sort((a, b) => a.number - b.number);
    const updated: Player[] = [...gks];
    let i = 0;
    for (let d = 0; d < preset.DEF && i < field.length; d++, i++) updated.push({ ...field[i], position: "DEF" });
    for (let m = 0; m < preset.MID && i < field.length; m++, i++) updated.push({ ...field[i], position: "MID" });
    for (let f = 0; f < preset.FWD && i < field.length; f++, i++) updated.push({ ...field[i], position: "FWD" });
    while (i < field.length) { updated.push({ ...field[i], position: "FWD" }); i++; }
    // Keep bench players as-is
    const updatedIds = new Set(updated.map((p) => p.id));
    const newPlayers = [...updated, ...players.filter((p) => !updatedIds.has(p.id))];
    setPlayers(newPlayers);
    setSelectedId(null);
    setSaved(false);
  }

  function movePlayer(id: string, pos: Pos) {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, position: pos } : p)));
    setSelectedId(null);
    setSaved(false);
  }

  return (
    <div onClick={() => setSelectedId(null)}>
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Formation:</span>
        <div className="flex gap-1">
          {Object.keys(FORMATIONS).map((f) => (
            <button
              key={f}
              onClick={() => applyFormation(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFormation === f
                  ? "bg-[var(--color-accent)] text-[#1c1c1e]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Starters count */}
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-xs text-gray-500">On field:</span>
          <input
            type="number"
            value={startersCount}
            min={1}
            max={players.length}
            onChange={(e) => setStartersCount(Math.max(1, Math.min(players.length, parseInt(e.target.value) || 11)))}
            onClick={(e) => e.stopPropagation()}
            className="w-12 text-center text-xs border border-gray-200 rounded-md px-1 py-1 focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        <span className="ml-auto text-xs text-gray-400 font-mono">{formation}</span>
        <button
          onClick={() => setSaved(true)}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            saved ? "bg-green-100 text-green-700" : "bg-[var(--color-accent)] text-[#1c1c1e] hover:bg-[var(--color-accent-light)]"
          }`}
        >
          {saved ? "Saved ✓" : "Save Formation"}
        </button>
      </div>

      <p className="text-[11px] text-gray-400 mb-4">Tap a player to change their position.</p>

      {/* Field + Bench layout */}
      <div className="flex gap-4 items-start">
        {/* Soccer field */}
        <div className="flex-1 min-w-0">
          <div
            className="relative w-full max-w-[580px] rounded-2xl overflow-visible shadow-2xl"
            style={{ aspectRatio: "3/4" }}
          >
            {/* Background */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden"
              style={{
                background: "#2e7d32",
                backgroundImage: "repeating-linear-gradient(to bottom, transparent 0px, transparent 40px, rgba(0,0,0,0.07) 40px, rgba(0,0,0,0.07) 80px)",
              }}
            >
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden="true">
                <rect x="8" y="8" width="284" height="384" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="2.5" />
                <line x1="8" y1="200" x2="292" y2="200" stroke="white" strokeOpacity="0.5" strokeWidth="2" />
                <circle cx="150" cy="200" r="42" fill="none" stroke="white" strokeOpacity="0.45" strokeWidth="2" />
                <circle cx="150" cy="200" r="3" fill="white" fillOpacity="0.6" />
                <rect x="68" y="8" width="164" height="80" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
                <rect x="108" y="8" width="84" height="28" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
                <rect x="126" y="2" width="48" height="10" fill="rgba(255,255,255,0.15)" stroke="white" strokeOpacity="0.6" strokeWidth="2" rx="1" />
                <circle cx="150" cy="68" r="2.5" fill="white" fillOpacity="0.55" />
                <path d="M 100 88 A 52 52 0 0 1 200 88" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
                <rect x="68" y="312" width="164" height="80" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
                <rect x="108" y="364" width="84" height="28" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
                <rect x="126" y="388" width="48" height="10" fill="rgba(255,255,255,0.15)" stroke="white" strokeOpacity="0.6" strokeWidth="2" rx="1" />
                <circle cx="150" cy="332" r="2.5" fill="white" fillOpacity="0.55" />
                <path d="M 100 312 A 52 52 0 0 0 200 312" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
                <path d="M 8 24 Q 8 8 24 8" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
                <path d="M 276 8 Q 292 8 292 24" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
                <path d="M 8 376 Q 8 392 24 392" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
                <path d="M 276 392 Q 292 392 292 376" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
              </svg>
            </div>

            {/* Player rows */}
            {ROWS.map(({ key, top }) =>
              grouped[key].length > 0 ? (
                <div
                  key={key}
                  className="absolute left-0 right-0 px-3 flex justify-evenly items-center"
                  style={{ top, transform: "translateY(-50%)", zIndex: 10 }}
                >
                  {grouped[key].map((p) => (
                    <FieldPlayerToken
                      key={p.id}
                      player={p}
                      isSelected={selectedId === p.id}
                      onToggle={() => setSelectedId(selectedId === p.id ? null : p.id)}
                      onMove={(pos) => movePlayer(p.id, pos)}
                    />
                  ))}
                </div>
              ) : null
            )}

            {/* Position labels */}
            {ROWS.map(({ key, top }) => (
              <div key={key} className="absolute pointer-events-none" style={{ top, left: "4%", transform: "translateY(-50%)", zIndex: 5 }}>
                <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bench sidebar */}
        {bench.length > 0 && (
          <div className="w-36 flex-shrink-0 pt-1">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span>Bench</span>
              <span className="bg-gray-200 text-gray-500 rounded-full px-1.5 py-0.5 text-[9px] font-bold">{bench.length}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {bench.map((p) => (
                <BenchCard key={p.id} player={p} />
              ))}
            </div>
            <p className="text-[9px] text-gray-300 mt-3 leading-relaxed">
              Adjust "On field" count above to move players on/off the bench.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
