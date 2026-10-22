"use client";

import { useState } from "react";
import type { AdminAccount, AdminRole } from "@/lib/admin-accounts";

type Row = AdminAccount & { _loading?: boolean };

function accountStatus(account: AdminAccount): "pending" | "active" | "revoked" {
  if (account.approved) return "active";
  if (account.revoked) return "revoked";
  return "pending";
}

export default function AdminUsersTable({ initial }: { initial: AdminAccount[] }) {
  const [accounts, setAccounts] = useState<Row[]>(initial);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  // Approve flow: track which account has the role selector open
  const [approveId, setApproveId] = useState<string | null>(null);
  const [approveRole, setApproveRole] = useState<AdminRole>("admin");

  function setRowLoading(id: string, loading: boolean) {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, _loading: loading } : a)));
  }

  async function handleApprove(account: Row) {
    setRowLoading(account.id, true);
    setApproveId(null);
    await fetch(`/api/neo/admin-users/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", role: approveRole }),
    });
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === account.id
          ? { ...a, approved: true, revoked: false, role: approveRole, _loading: false }
          : a
      )
    );
  }

  async function handleRevoke(account: Row) {
    setRowLoading(account.id, true);
    await fetch(`/api/neo/admin-users/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke" }),
    });
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === account.id ? { ...a, approved: false, revoked: true, _loading: false } : a
      )
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

  // Sort: pending first, then active, then revoked
  const sorted = [...accounts].sort((a, b) => {
    const order = { pending: 0, active: 1, revoked: 2 };
    return order[accountStatus(a)] - order[accountStatus(b)];
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{accounts.length} account{accounts.length !== 1 ? "s" : ""}</p>
      </div>

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
                  No admin accounts yet. Coaches can request access at /admin/register.
                </td>
              </tr>
            )}
            {sorted.map((account, i) => {
              const status = accountStatus(account);
              return (
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
                        status === "active"
                          ? "bg-green-100 text-green-700"
                          : status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {status === "active" ? "Active" : status === "pending" ? "Pending" : "Revoked"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {status === "active" && (
                          <button
                            onClick={() => { setResetId(resetId === account.id ? null : account.id); setResetPassword(""); }}
                            className="text-xs text-gray-500 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                            disabled={account._loading}
                          >
                            Reset pw
                          </button>
                        )}
                        {status === "pending" && (
                          <button
                            onClick={() => {
                              setApproveRole("admin");
                              setApproveId(approveId === account.id ? null : account.id);
                            }}
                            disabled={account._loading}
                            className="text-xs font-bold px-3 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-40"
                          >
                            {account._loading ? "…" : "Approve…"}
                          </button>
                        )}
                        {status === "active" && (
                          <button
                            onClick={() => handleRevoke(account)}
                            disabled={account._loading}
                            className="text-xs font-bold px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-40"
                          >
                            {account._loading ? "…" : "Revoke"}
                          </button>
                        )}
                        {status === "revoked" && (
                          <button
                            onClick={() => {
                              setApproveRole("admin");
                              setApproveId(approveId === account.id ? null : account.id);
                            }}
                            disabled={account._loading}
                            className="text-xs font-bold px-3 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-40"
                          >
                            {account._loading ? "…" : "Re-approve…"}
                          </button>
                        )}
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
                  {approveId === account.id && (
                    <tr key={`${account.id}-approve`} className="border-b border-gray-50 bg-green-50">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-green-800 shrink-0">
                            Approving {account.displayName} — select role:
                          </span>
                          <select
                            value={approveRole}
                            onChange={(e) => setApproveRole(e.target.value as AdminRole)}
                            className="border border-green-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                          >
                            <option value="admin">Admin (full access)</option>
                            <option value="media_uploader">Media Uploader (photos &amp; videos only)</option>
                          </select>
                          <button
                            onClick={() => handleApprove(account)}
                            className="text-xs font-bold px-3 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
                          >
                            Confirm Approval
                          </button>
                          <button
                            onClick={() => setApproveId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
