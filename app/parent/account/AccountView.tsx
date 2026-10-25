"use client";

import { useState, useEffect, useCallback } from "react";
import type { ParentAccount } from "@/lib/parent-auth";
import type { Player } from "@/lib/types";

type RosterPlayer = Player & { team: "U11" | "U12"; claimedByMe: boolean; claimed: boolean };

export default function AccountView({
  account,
  welcome,
}: {
  account: ParentAccount;
  welcome: boolean;
}) {
  const [claimedIds, setClaimedIds] = useState<string[]>(account.playerIds);
  const [roster, setRoster] = useState<RosterPlayer[] | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoster = useCallback(async () => {
    setPickerLoading(true);
    try {
      const res = await fetch("/api/parent/roster");
      if (res.ok) setRoster(await res.json());
    } finally {
      setPickerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showPicker && !roster) fetchRoster();
  }, [showPicker, roster, fetchRoster]);

  async function handleClaim(playerId: string) {
    setActionLoading(playerId);
    setError(null);
    try {
      const res = await fetch("/api/parent/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (res.ok) {
        setClaimedIds((prev) => [...prev, playerId]);
        setRoster((prev) =>
          prev?.map((p) => (p.id === playerId ? { ...p, claimed: true, claimedByMe: true } : p)) ?? null,
        );
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Could not claim player.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRelease(playerId: string) {
    setActionLoading(playerId);
    setError(null);
    try {
      const res = await fetch("/api/parent/players", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (res.ok) {
        setClaimedIds((prev) => prev.filter((id) => id !== playerId));
        setRoster((prev) =>
          prev?.map((p) => (p.id === playerId ? { ...p, claimed: false, claimedByMe: false } : p)) ?? null,
        );
      }
    } catch {
      setError("Network error.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      await fetch("/api/parent/logout", { method: "POST" });
    } finally {
      window.location.href = "/family";
    }
  }

  const claimedPlayers = roster?.filter((p) => claimedIds.includes(p.id)) ?? [];

  const u11Claimable = roster?.filter((p) => !p.claimed && !claimedIds.includes(p.id) && p.team === "U11") ?? [];
  const u12Claimable = roster?.filter((p) => !p.claimed && !claimedIds.includes(p.id) && p.team === "U12") ?? [];

  return (
    <div className="min-h-screen bg-[var(--color-navy)] flex items-center justify-center px-4 py-10">
      {/* Top-right sign out */}
      <div className="fixed top-4 right-4">
        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className="text-xs text-gray-400 hover:text-white transition-colors bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 disabled:opacity-40"
        >
          {logoutLoading ? "…" : "Sign out"}
        </button>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">

        {welcome && (
          <div className="bg-green-500/20 border border-green-500/40 rounded-xl px-4 py-3 text-green-300 text-sm font-semibold text-center">
            Welcome, {account.displayName}! Your account is ready.
          </div>
        )}

        {!account.approved && (
          <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl px-4 py-3 text-amber-300 text-sm">
            Your account is pending coach approval. You&apos;ll get full access shortly.
          </div>
        )}

        {/* Account info */}
        <div className="bg-white/5 backdrop-blur rounded-2xl p-6 shadow-2xl border border-white/10">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Your Account</p>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Name</span>
              <span className="text-white font-semibold">{account.displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email</span>
              <span className="text-white">{account.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Member since</span>
              <span className="text-white">
                {new Date(account.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* My players */}
        <div className="bg-white/5 backdrop-blur rounded-2xl p-6 shadow-2xl border border-white/10">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">My Players</p>

          {claimedIds.length === 0 && (
            <p className="text-sm text-gray-400 mb-3">
              No players linked yet. Claim your child below.
            </p>
          )}

          {/* Claimed list — only shows once roster is loaded */}
          {claimedIds.length > 0 && roster && claimedPlayers.length > 0 && (
            <ul className="flex flex-col gap-2 mb-4">
              {claimedPlayers.map((p) => (
                <li key={p.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-white font-semibold text-sm">{p.name}</span>
                    <span className="text-gray-400 text-xs ml-2">#{p.number} · {p.team}</span>
                  </div>
                  <button
                    onClick={() => handleRelease(p.id)}
                    disabled={actionLoading === p.id}
                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
                  >
                    {actionLoading === p.id ? "…" : "Release"}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {claimedIds.length > 0 && !roster && (
            <div className="mb-4 text-sm text-gray-400">{claimedIds.length} player(s) linked.</div>
          )}

          {/* Roster picker */}
          {showPicker && (
            <div className="mt-2 border-t border-white/10 pt-4">
              <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-widest">
                Available players
              </p>
              {pickerLoading && <p className="text-sm text-gray-400">Loading roster…</p>}
              {!pickerLoading && u11Claimable.length === 0 && u12Claimable.length === 0 && (
                <p className="text-sm text-gray-400">
                  All players are currently claimed by other families.
                </p>
              )}

              {/* U11 group */}
              {!pickerLoading && u11Claimable.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-[var(--color-accent)] font-bold uppercase tracking-widest mb-1.5">U11</p>
                  <ul className="flex flex-col gap-2">
                    {u11Claimable.map((p) => (
                      <li key={p.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                        <div>
                          <span className="text-white text-sm">{p.name}</span>
                          <span className="text-gray-400 text-xs ml-2">#{p.number}</span>
                        </div>
                        <button
                          onClick={() => handleClaim(p.id)}
                          disabled={actionLoading === p.id}
                          className="text-xs text-[var(--color-accent)] hover:opacity-80 disabled:opacity-40 font-semibold transition-opacity"
                        >
                          {actionLoading === p.id ? "…" : "Claim"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* U12 group */}
              {!pickerLoading && u12Claimable.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-[var(--color-accent)] font-bold uppercase tracking-widest mb-1.5">U12</p>
                  <ul className="flex flex-col gap-2">
                    {u12Claimable.map((p) => (
                      <li key={p.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                        <div>
                          <span className="text-white text-sm">{p.name}</span>
                          <span className="text-gray-400 text-xs ml-2">#{p.number}</span>
                        </div>
                        <button
                          onClick={() => handleClaim(p.id)}
                          disabled={actionLoading === p.id}
                          className="text-xs text-[var(--color-accent)] hover:opacity-80 disabled:opacity-40 font-semibold transition-opacity"
                        >
                          {actionLoading === p.id ? "…" : "Claim"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => { window.location.href = "/family"; }}
                  className="flex-1 py-2 bg-[var(--color-accent)] text-[var(--color-navy)] text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Done · Family Portal
                </button>
                <button
                  onClick={() => setShowPicker(false)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400 mt-2">⚠ {error}</p>}

          {!showPicker && (
            <button
              onClick={() => setShowPicker(true)}
              className="mt-1 w-full py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              + Link a player
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
