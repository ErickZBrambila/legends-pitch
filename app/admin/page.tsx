import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import AdminLogin from "./AdminLogin";

export const metadata = { title: "🔐 Admin Login · NLFC" };

export default async function AdminPage() {
  const authed = await getAdminSession();
  if (authed) redirect("/admin/dashboard");
  return <AdminLogin />;
}
