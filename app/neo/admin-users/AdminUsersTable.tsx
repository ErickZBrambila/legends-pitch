"use client";

import { useState } from "react";
import type { AdminAccount, AdminRole } from "@/lib/admin-accounts";

type Row = AdminAccount & { _loading?: boolean };

export default function AdminUsersTable({ initial }: { initial: AdminAccount[] }) {
  const [accounts, setAccounts] = useState<Row[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", displayName: "", password: "", role: "admin" as AdminRole });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  function setRowLoading(id: string, loading: boolean) {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, _loading: loading } : a)));
  }

  async function toggleApproval(account: Row) {
    setRowLoading(account.id, true);
    const action = account.approved ? "revoke" : "approve";
    await fetch(`/api/neo/admin-users/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? { ...a, approved: !account.approved, _loading: false } : a))
    );
  }

  async function deleteAccount(account: Row) {
    if (!confirm(`Delete ${account.displayName}? This cannot be undone.`)) return;
    setRowLoading(account.id, true);
    await fetch(`/api/neo/admin-users/${account.id}`, { method: "DELETE" });
    setAccounts((prev) => prev.filter((a) => a.id !== account.id));
  }

  async function handleResetPassword(id: string) {
    if (resetPassword.length < 8) return;
    setResetLoading(true);
    const res = await fetch(`/api/neo/admin-users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset-password", newPassword: resetPassword }),
    });
    setResetLoading(false);
    if (res.ok) {
      setResetId(null);
      setResetPassword("");
    }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");
    const res = await fetch("/api/neo/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    if (res.ok) {
      const account: AdminAccount = await res.json();
      setAccounts((prev) => [account, ...prev]);
      setShowAdd(false);
      setAddForm({ email: "", displayName: "", password: "", role: "admin" });
    } else {
      const data = await res.json();
      setAddError(data.error ?? "Failed to create account");
    }
    setAddLoading(false);
  }

  const sorted = [...accounts].sort((a, b) => (!a.approved ? -1 : !b.approved ? 1 : 0));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{accounts.length} account{accounts.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-sm font-bold px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {showAdd ? "Cancel" : "+ Add Account"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddAccount} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Display Name</label>
              <input
                type="text"
                required
                value={addForm.displayName}
                onChange={(e) => setAddForm((f) => ({ ...f, displayName: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Coach Hugo"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
              <input
                type="email"
                required
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="coach@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="min 8 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Role</label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value as AdminRole }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="admin">Admin (full access)</option>
                <option value="media_uploader">Media Uploader (photos & videos only)</option>
              </select>
            </div>
          </div>
          {addError && <p className="text-sm text-red-500">{addError}</p>}
          <button
            type="submit"
            disabled={addLoading}
            className="self-end px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg disabled:opacity-50"
          >
            {addLoading ? "Creating…" : "Create Account"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Name</th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hidden sm:table-cell">Email</th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Role</th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
              <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No admin accounts yet. Add one above.
                </td>
              </tr>
            )}
            {sorted.map((account, i) => (
              <>
                <tr key={account.id} className={i < sorted.length - 1 ? "border-b border-gray-50" : ""}>
                  <td className="px-4 py-3 font-bold text-gray-900">{account.displayName}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{account.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      account.role === "admin"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}>
                      {account.role === "admin" ? "Admin" : "Media"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      account.approved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {account.approved ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setResetId(resetId === account.id ? null : account.id); setResetPassword(""); }}
                        className="text-xs text-gray-500 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                        disabled={account._loading}
                      >
                        Reset pw
                      </button>
                      <button
                        onClick={() => toggleApproval(account)}
                        disabled={account._loading}
                        className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                          account.approved
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        } disabled:opacity-40`}
                      >
                        {account._loading ? "…" : account.approved ? "Revoke" : "Approve"}
                      </button>
                      <button
                        onClick={() => deleteAccount(account)}
                        disabled={account._loading}
                        className="text-xs font-bold px-3 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {resetId === account.id && (
                  <tr key={`${account.id}-reset`} className="border-b border-gray-50 bg-amber-50">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-amber-700 shrink-0">New password for {account.displayName}:</span>
                        <input
                          type="password"
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          placeholder="min 8 characters"
                          minLength={8}
                          className="border border-amber-200 rounded-lg px-3 py-1.5 text-sm flex-1 max-w-xs bg-white"
                        />
                        <button
                          onClick={() => handleResetPassword(account.id)}
                          disabled={resetLoading || resetPassword.length < 8}
                          className="text-xs font-bold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-40 transition-colors"
                        >
                          {resetLoading ? "Saving…" : "Set Password"}
                        </button>
                        <button
                          onClick={() => { setResetId(null); setResetPassword(""); }}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
