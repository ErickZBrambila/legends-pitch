import { redirect } from "next/navigation";
import { getNeoSession } from "@/lib/neo-auth";
import { getAllAccounts } from "@/lib/parent-auth";
import ParentAccountsTable from "./ParentAccountsTable";

export const metadata = { title: "Parent Accounts · North Legends FC Admin" };

export default async function ParentsPage() {
  const authed = await getNeoSession();
  if (!authed) redirect("/neo/login");

  const accounts = await getAllAccounts();

  const pendingCount = accounts.filter((a) => !a.approved).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <a
            href="/neo"
            className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors mb-1 inline-block"
          >
            ← Admin
          </a>
          <h1 className="text-3xl font-black text-gray-900">Parent Accounts</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage family access — approve, revoke, and remove parent accounts.
          </p>
        </div>

        {/* Summary row */}
        <div className="flex gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">Total</p>
            <p className="text-2xl font-black text-gray-900">{accounts.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">Approved</p>
            <p className="text-2xl font-black text-green-600">{accounts.length - pendingCount}</p>
          </div>
          {pendingCount > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 shadow-sm px-4 py-3">
              <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-0.5">Pending</p>
              <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
            </div>
          )}
        </div>

        <ParentAccountsTable accounts={accounts} />

      </div>
    </div>
  );
}
