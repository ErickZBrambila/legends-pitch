import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import AdminDashboard from "./AdminDashboard";
import { matches, players, newsPosts, highlightVideos } from "@/lib/data";

export const metadata = { title: "Admin Dashboard | North Legends FC" };

export default async function DashboardPage() {
  const authed = await getAdminSession();
  if (!authed) redirect("/admin");

  return <AdminDashboard matches={matches} players={players} posts={newsPosts} highlights={highlightVideos} />;
}
