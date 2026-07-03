"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Match, Player, NewsPost } from "@/lib/types";
import AdminRosterField from "@/components/AdminRosterField";

const TABS = ["Schedule", "Roster", "News", "Setup"] as const;
type Tab = typeof TABS[number];

const RESULT_BADGE: Record<string, string> = {
  W: "bg-green-100 text-green-800",
  L: "bg-red-100 text-red-800",
  D: "bg-yellow-100 text-yellow-800",
};

const POS_BADGE: Record<string, string> = {
  GK:  "bg-yellow-100 text-yellow-800",
  DEF: "bg-blue-100 text-blue-800",
  MID: "bg-green-100 text-green-800",
  FWD: "bg-red-100 text-red-800",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

const SETUP_ITEMS = [
  { id: "roster_count",   label: "Total # of players on roster",       hint: "How many players are on the team this season?" },
  { id: "jersey",         label: "Real player names & jersey numbers",  hint: "First name (or full) + jersey # for each player" },
  { id: "schedule",       label: "Full season schedule",                hint: "Game dates, times, opponents, home/away" },
  { id: "practice",       label: "Practice days & times",               hint: "Days of week, start/end time, field name" },
  { id: "field_address",  label: "Home field address",                  hint: "Full street address for the map embed" },
  { id: "email",          label: "Team contact email",                  hint: "Public email parents can use to reach the team" },
  { id: "coaches",        label: "Coaching staff names & roles",        hint: "Head coach, assistant(s), team manager" },
  { id: "league",         label: "League name & season",                hint: 'e.g., "Georgetown Youth Soccer League, Summer 2026"' },
  { id: "tagline",        label: "Team motto / tagline",                hint: 'A one-liner for the hero banner' },
  { id: "photos",         label: "Team photos for gallery",             hint: "Game or practice photos to replace the placeholders" },
];

export default function AdminDashboard({
  matches,
  players: initialPlayers,
  posts,
}: {
  matches: Match[];
  players: Player[];
  posts: NewsPost[];
}) {
  const [tab, setTab] = useState<Tab>("Schedule");
  const [rosterView, setRosterView] = useState<"field" | "table">("field");
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState<{ name: string; number: string; position: Player["position"] }>({
    name: "", number: "", position: "MID",
  });
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!newPlayer.name.trim() || !newPlayer.number) return;
    const player: Player = {
      id: `player-${Date.now()}`,
      name: newPlayer.name.trim(),
      number: parseInt(newPlayer.number),
      position: newPlayer.position,
    };
    setPlayers((prev) => [...prev, player]);
    setShowAddPlayer(false);
    setNewPlayer({ name: "", number: "", position: "MID" });
  }

  function toggleCheck(id: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-[#1c1c1e] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--color-accent)] shadow-md flex-shrink-0">
              <Image src="/logo.jpg" alt="crest" width={32} height={32} className="object-cover" />
            </div>
            <span className="font-bold text-white text-sm">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" className="text-xs text-gray-400 hover:text-white transition-colors">
              View Site ↗
            </a>
            <button
              onClick={logout}
              className="text-xs px-3 py-1.5 rounded-md bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-[var(--color-accent)] text-[#1c1c1e] shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Schedule ── */}
        {tab === "Schedule" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Schedule & Results</h2>
              <button className="px-4 py-2 bg-[var(--color-accent)] text-[#1c1c1e] text-sm font-bold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors">
                + Add Game
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-400 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Opponent</th>
                    <th className="px-4 py-3 text-center">H/A</th>
                    <th className="px-4 py-3 text-center">Score</th>
                    <th className="px-4 py-3 text-center">Result</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...matches]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(m.date)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">vs {m.opponent}</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500 capitalize">{m.homeAway}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-700">
                          {m.result ? `${m.goalsFor} – ${m.goalsAgainst}` : <span className="text-gray-300">TBD</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {m.result ? (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_BADGE[m.result]}`}>{m.result}</span>
                          ) : (
                            <button className="text-xs px-3 py-1 bg-[var(--color-primary)] text-white rounded-full font-semibold hover:opacity-80 transition-opacity">
                              Enter Score
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Roster ── */}
        {tab === "Roster" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Team Roster</h2>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                  {(["field", "table"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setRosterView(v)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        rosterView === v
                          ? "bg-[var(--color-accent)] text-[#1c1c1e] shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {v === "field" ? "⚽ Field" : "☰ Table"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowAddPlayer(true)}
                  className="px-4 py-2 bg-[var(--color-accent)] text-[#1c1c1e] text-sm font-bold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors"
                >
                  + Add Player
                </button>
              </div>
            </div>

            {rosterView === "field" ? (
              <AdminRosterField initialPlayers={players} />
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-400 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-center">Position</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[...players].sort((a, b) => a.number - b.number).map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="w-8 h-8 rounded-full bg-[#1c1c1e] flex items-center justify-center">
                            <span className="text-xs font-black text-[var(--color-accent)]">{p.number}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{p.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${POS_BADGE[p.position]}`}>
                            {p.position}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                          <button className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors">Edit</button>
                          <button
                            onClick={() => setPlayers((prev) => prev.filter((pl) => pl.id !== p.id))}
                            className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── News ── */}
        {tab === "News" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Announcements</h2>
              <button className="px-4 py-2 bg-[var(--color-accent)] text-[#1c1c1e] text-sm font-bold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors">
                + New Post
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {[...posts]
                .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
                .map((post) => (
                  <div key={post.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-1">
                        {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {post.author}
                      </p>
                      <h3 className="font-bold text-gray-800 text-sm leading-snug truncate">{post.title}</h3>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-1">{post.excerpt}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors">Edit</button>
                      <button className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">Delete</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Setup Checklist ── */}
        {tab === "Setup" && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800">Coach Info Checklist</h2>
              <p className="text-sm text-gray-500 mt-1">
                Check off each item as you provide the real info. Once all boxes are checked the site is ready to go live.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {SETUP_ITEMS.map((item, i) => (
                <label key={item.id} className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={checkedItems.has(item.id)}
                    onChange={() => toggleCheck(item.id)}
                    className="mt-0.5 w-4 h-4 rounded accent-[var(--color-accent)] flex-shrink-0"
                  />
                  <div>
                    <div className={`text-sm font-semibold ${checkedItems.has(item.id) ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {i + 1}. {item.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.hint}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Progress */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500"
                  style={{ width: `${(checkedItems.size / SETUP_ITEMS.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-500 tabular-nums">
                {checkedItems.size}/{SETUP_ITEMS.length}
              </span>
            </div>
            {checkedItems.size === SETUP_ITEMS.length && (
              <p className="mt-3 text-sm font-bold text-green-600">
                All set — ready to deploy!
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Add Player Modal ── */}
      {showAddPlayer && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowAddPlayer(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-gray-800 mb-4">Add Player</h3>
            <form onSubmit={handleAddPlayer} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Alex"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Jersey #</label>
                <input
                  type="number"
                  value={newPlayer.number}
                  onChange={(e) => setNewPlayer((p) => ({ ...p, number: e.target.value }))}
                  placeholder="e.g. 7"
                  min={1}
                  max={99}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Position</label>
                <select
                  value={newPlayer.position}
                  onChange={(e) => setNewPlayer((p) => ({ ...p, position: e.target.value as Player["position"] }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] bg-white"
                >
                  <option value="GK">GK — Goalkeeper</option>
                  <option value="DEF">DEF — Defender</option>
                  <option value="MID">MID — Midfielder</option>
                  <option value="FWD">FWD — Forward</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddPlayer(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[var(--color-accent)] text-[#1c1c1e] text-sm font-bold hover:bg-[var(--color-accent-light)] transition-colors"
                >
                  Add Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
