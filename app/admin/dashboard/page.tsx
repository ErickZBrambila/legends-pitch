import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import Link from "next/link";

export const metadata = { title: "Admin · North Legends FC" };

function HubCard({
  href,
  external,
  title,
  description,
  badge,
}: {
  href: string;
  external?: boolean;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-gray-200 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="text-lg font-black text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">
          {title}
        </h2>
        {badge && (
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
            {badge}
          </span>
        )}
        {external && (
          <span className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0">↗</span>
        )}
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}

export default async function DashboardPage() {
  const authed = await getAdminSession();
  if (!authed) redirect("/admin");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Admin</p>
          <h1 className="text-3xl font-black text-gray-900">North Legends FC</h1>
          <p className="text-gray-500 text-sm mt-1">Internal tools and content management.</p>
        </div>

        <div className="flex flex-col gap-4">
          <HubCard
            href="/studio"
            external
            title="Sanity Studio"
            description="Manage all site content — schedule, roster, news, gallery, KickReel sessions, sponsors, and coach info."
            badge="Live"
          />
          <HubCard
            href="/admin/tracker"
            title="Project Tracker"
            description="Hours, features shipped, KickReel pipeline runs, Claude cost, and running service costs."
          />
        </div>
      </div>
    </div>
  );
}
