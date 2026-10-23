import { redirect } from "next/navigation";
import { getNeoSession } from "@/lib/neo-auth";
import { getAllAdminAccounts } from "@/lib/admin-accounts";
import AdminUsersTable from "./AdminUsersTable";

export const metadata = { title: "Admin Users · NEO" };

export default async function AdminUsersPage() {
  const authed = await getNeoSession();
  if (!authed) redirect("/neo/login");

  const accounts = await getAllAdminAccounts();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <a href="/neo" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← NEO</a>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 mt-3">NEO · Internal</p>
          <h1 className="text-3xl font-black text-gray-900">Admin Users</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage coach and staff accounts. Admins get full access; media uploaders can only access Photos &amp; Videos.
            <br />
            <span className="text-amber-600 font-medium">Password resets are done here — no email flow yet (coming when DNS moves to Cloudflare).</span>
          </p>
        </div>
        <AdminUsersTable initial={accounts} />
      </div>
    </div>
  );
}
