import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getAllPendingSubmissions } from "@/lib/sanity/queries";
import AdminBreadcrumb from "@/components/AdminBreadcrumb";
import AdminLangToggle from "@/components/AdminLangToggle";
import Image from "next/image";
import PhotoQueue from "./PhotoQueue";

export const revalidate = 0;
export const metadata = { title: "⚙ Photos · Admin" };

const LABELS = {
  en: { crumb: "Photo Queue", heading: "Photo Queue", sub: "Review player photos submitted by parents. Approve to publish to the roster, reject to discard." },
  es: { crumb: "Cola de Fotos", heading: "Cola de Fotos", sub: "Revisa las fotos enviadas por los padres. Aprueba para publicar en la alineación, rechaza para descartar." },
};

export default async function AdminPhotosPage() {
  const [authed, locale] = await Promise.all([getAdminSession(), getLocale()]);
  if (!authed) redirect("/admin");

  const submissions = await getAllPendingSubmissions();
  const L = locale === "es" ? LABELS.es : LABELS.en;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1c1c1e] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--color-accent)] flex-shrink-0">
              <Image src="/logo.jpg" alt="crest" width={32} height={32} className="object-cover" />
            </div>
            <AdminBreadcrumb crumbs={[
              { label: locale === "es" ? "Panel" : "Dashboard", href: "/admin/dashboard" },
              { label: L.crumb },
            ]} />
          </div>
          <AdminLangToggle locale={locale} />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">{L.heading}</h1>
          <p className="text-sm text-gray-500 mt-1">{L.sub}</p>
          {submissions.length > 0 && (
            <span className="inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {submissions.length} pending
            </span>
          )}
        </div>
        <PhotoQueue submissions={submissions} />
      </div>
    </div>
  );
}
