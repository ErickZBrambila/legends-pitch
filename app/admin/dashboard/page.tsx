import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import Link from "next/link";
import Image from "next/image";
import AdminBreadcrumb from "@/components/AdminBreadcrumb";

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
      <header className="bg-[#1c1c1e] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--color-accent)] shadow-md flex-shrink-0">
              <Image src="/logo.jpg" alt="crest" width={32} height={32} className="object-cover" />
            </div>
            <AdminBreadcrumb crumbs={[{ label: "Dashboard" }]} />
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" className="text-xs text-gray-400 hover:text-white transition-colors">View Site ↗</a>
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Admin</p>
          <h1 className="text-3xl font-black text-gray-900">North Legends FC</h1>
          <p className="text-gray-500 text-sm mt-1">Internal tools and content management.</p>
        </div>

        <div className="flex flex-col gap-4">
          <HubCard
            href="/admin/announcements"
            title="Announcements"
            description="Post coach announcements for families. Claude auto-translates every message to Spanish."
            badge="New"
          />
          <HubCard
            href="/admin/articles"
            title="Match Articles"
            description="Generate bilingual match recap articles with Claude. Choose tone — Friendly, Formal, or Hype — then review and publish."
            badge="New"
          />
          <HubCard
            href="/studio"
            external
            title="Sanity Studio"
            description="Manage all site content — schedule, roster, news, gallery, KickReel sessions, sponsors, and coach info."
            badge="Live"
          />
        </div>
      </div>
    </div>
  );
}
