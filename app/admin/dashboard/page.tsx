import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getAdminSession } from "@/lib/admin-auth";
import Link from "next/link";
import Image from "next/image";
import AdminLangToggle from "@/components/AdminLangToggle";

export const metadata = { title: "Admin · North Legends FC" };

const CONTENT = {
  en: {
    label: "Admin",
    heading: "North Legends FC",
    subheading: "Internal tools and content management.",
    viewSite: "View Site ↗",
    cards: [
      {
        href: "/admin/announcements",
        title: "Announcements",
        description: "Post coach announcements for families. Claude auto-translates every message.",
        badge: "New",
      },
      {
        href: "/admin/articles",
        title: "Match Articles",
        description: "Generate bilingual match recap articles with Claude. Choose tone — Friendly, Formal, or Hype — then review and publish.",
        badge: "New",
      },
      {
        href: "/admin/votes",
        title: "Feature Voting",
        description: "Mark wishlist items as coaching staff priorities. See community votes alongside your flags.",
        badge: "New",
      },
      {
        href: "/studio",
        external: true,
        title: "Sanity Studio",
        description: "Manage all site content — schedule, roster, news, gallery, KickReel sessions, sponsors, and coach info.",
        badge: "Live",
      },
    ],
  },
  es: {
    label: "Admin",
    heading: "North Legends FC",
    subheading: "Herramientas internas y gestión de contenido.",
    viewSite: "Ver Sitio ↗",
    cards: [
      {
        href: "/admin/announcements",
        title: "Anuncios",
        description: "Publica anuncios para las familias. Claude traduce cada mensaje automáticamente.",
        badge: "Nuevo",
      },
      {
        href: "/admin/articles",
        title: "Artículos de Partidos",
        description: "Genera artículos bilingües sobre partidos con Claude. Elige el tono — Amistoso, Formal o Emocionante — y publícalos.",
        badge: "Nuevo",
      },
      {
        href: "/admin/votes",
        title: "Votación de Funciones",
        description: "Marca elementos de la lista de deseos como prioridades del cuerpo técnico. Ve los votos de la comunidad junto con tus banderas.",
        badge: "Nuevo",
      },
      {
        href: "/studio",
        external: true,
        title: "Sanity Studio",
        description: "Gestiona todo el contenido del sitio — calendario, jugadores, noticias, galería, sesiones KickReel, patrocinadores e info del entrenador.",
        badge: "En vivo",
      },
    ],
  },
};

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
  const [authed, locale] = await Promise.all([getAdminSession(), getLocale()]);
  if (!authed) redirect("/admin");
  const c = locale === "es" ? CONTENT.es : CONTENT.en;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1c1c1e] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--color-accent)] shadow-md flex-shrink-0">
              <Image src="/logo.jpg" alt="crest" width={32} height={32} className="object-cover" />
            </div>
            <span className="font-bold text-white text-sm">{c.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <AdminLangToggle locale={locale} />
            <a href="/" target="_blank" className="text-xs text-gray-400 hover:text-white transition-colors">{c.viewSite}</a>
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{c.label}</p>
          <h1 className="text-3xl font-black text-gray-900">{c.heading}</h1>
          <p className="text-gray-500 text-sm mt-1">{c.subheading}</p>
        </div>
        <div className="flex flex-col gap-4">
          {c.cards.map((card) => (
            <HubCard key={card.href} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}
