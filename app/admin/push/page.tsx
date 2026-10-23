import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import Link from "next/link";
import Image from "next/image";
import AdminBreadcrumb from "@/components/AdminBreadcrumb";
import PushSender from "@/components/PushSender";

export const metadata = { title: "Push Notifications · Admin · NLFC" };

export default async function PushPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin");
  if (session.role !== "admin") redirect("/admin/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1c1c1e] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--color-accent)] shadow-md flex-shrink-0">
              <Image src="/logo.jpg" alt="crest" width={32} height={32} className="object-cover" />
            </div>
            <AdminBreadcrumb
              crumbs={[
                { label: "Admin", href: "/admin/dashboard" },
                { label: "Push Notifications" },
              ]}
            />
          </div>
          <Link href="/admin/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">
            ← Back
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Admin</p>
          <h1 className="text-3xl font-black text-gray-900">Push Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            Send a push notification to all subscribed families.
          </p>
        </div>
        <PushSender senderName={session.displayName} />
      </div>
    </div>
  );
}
