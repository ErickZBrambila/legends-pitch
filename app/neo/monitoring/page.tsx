import { redirect } from "next/navigation";
import { getNeoSession } from "@/lib/neo-auth";
import { getAnalytics } from "@/lib/analytics";
import MonitoringDashboard from "./MonitoringDashboard";

export const metadata = { title: "> [NEO] Monitoring_" };
export const revalidate = 60;

export default async function MonitoringPage() {
  const authed = await getNeoSession();
  if (!authed) redirect("/neo/login");

  const data = await getAnalytics();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Admin · Internal</p>
          <h1 className="text-3xl font-black text-gray-900">Site Monitoring</h1>
          <p className="text-gray-500 text-sm mt-1">Page views, visitors, and push subscribers — last 14 days.</p>
        </div>
        <MonitoringDashboard data={data} />
      </div>
    </div>
  );
}
