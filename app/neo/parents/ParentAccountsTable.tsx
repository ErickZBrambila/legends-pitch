"use client";

import { useState } from "react";
import type { ParentAccount } from "@/lib/parent-auth";

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface RowState {
  loading: boolean;
}

export default function ParentAccountsTable({
  accounts: initial,
}: {
  accounts: ParentAccount[];
}) {
  const [accounts, setAccounts] = useState<ParentAccount[]>(initial);
  const [rowState, setRowState] = useState<Record<string, RowState>>({});

  function setLoading(id: string, loading: boolean) {
    setRowState((prev) => ({ ...prev, [id]: { loading } }));
  }

  async function handleApprove(id: string, approve: boolean) {
    setLoading(id, true);
    try {
      const res = await fetch(`/api/neo/parents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: approve }),
      });
      if (!res.ok) throw new Error("Request failed");
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, approved: approve } : a))
      );
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(id, false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this parent account? This action cannot be undone."
    );
    if (!confirmed) return;
    setLoading(id, true);
    try {
      const res = await fetch(`/api/neo/parents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(id, false);
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <p className="text-gray-400 text-sm font-medium">No parent accounts yet.</p>
        <p className="text-gray-300 text-xs mt-1">
          When parents register, their accounts will appear here.
        </p>
      </div>
    );
  }

  const pending = accounts.filter((a) => !a.approved);
  const approved = accounts.filter((a) => a.approved);
  const sorted = [...pending, ...approved];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">
              Parent
            </th>
            <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hidden sm:table-cell">
              Email
            </th>
            <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hidden md:table-cell">
              Player
            </th>
            <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hidden lg:table-cell">
              Member Since
            </th>
            <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">
              Status
            </th>
            <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((account, i) => {
            const isLoading = rowState[account.id]?.loading ?? false;
            return (
              <tr
                key={account.id}
                className={
                  i < sorted.length - 1 ? "border-b border-gray-50" : ""
                }
              >
                <td className="px-4 py-3">
                  <p className="font-bold text-gray-900">{account.displayName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 sm:hidden">
                    {account.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 md:hidden">
                    {account.playerName}
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                  {account.email}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                  {account.playerName}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell font-mono">
                  {formatDate(account.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {account.approved ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end flex-wrap">
                    {account.approved ? (
                      <button
                        onClick={() => handleApprove(account.id, false)}
                        disabled={isLoading}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "..." : "Revoke"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(account.id, true)}
                        disabled={isLoading}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "..." : "Approve"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(account.id)}
                      disabled={isLoading}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
