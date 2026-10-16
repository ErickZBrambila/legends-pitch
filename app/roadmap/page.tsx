import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import FeedbackForm from "./FeedbackForm";
import WishlistSection from "./WishlistSection";
import { getAllVotes } from "@/lib/votes";

export const metadata: Metadata = {
  title: "What's Coming · North Legends FC",
  description: "See what's live on the North Legends FC app, what we're building next, and share your ideas.",
};

const CONTENT = {
  en: {
    heading: "What's Coming",
    subheading: "This is your team's app — here's what's live, what we're building next, and where we want to take it. Got an idea? Tell us at the bottom.",
    feedbackHeading: "Share your ideas",
    feedbackBody: "Found a bug? Have a feature idea? Want something moved up the list? We read every message.",
    live: {
      badge: "✅ Live",
      title: "Live now",
      items: [
        { emoji: "📅", title: "Game schedule", desc: "Live weather forecasts and Google Maps links for every field." },
        { emoji: "👕", title: "Team roster", desc: "Field view and list view with positions." },
        { emoji: "📸", title: "Photo gallery", desc: "Albums from every game, auto-synced from Google Drive." },
        { emoji: "🎥", title: "Match videos (KickReel)", desc: "Full-quality 360° footage, clips, and highlights." },
        { emoji: "📆", title: "Calendar subscription", desc: "Subscribe on iPhone or Google Calendar — updates push automatically." },
        { emoji: "🌐", title: "English & Spanish", desc: "Full bilingual support across the entire site." },
        { emoji: "🔒", title: "Family-only access", desc: "Videos and gallery are passcode-protected — ask Coach Hugo for the code." },
        { emoji: "📰", title: "News & announcements", desc: "Pinned announcements from the coaching staff." },
        { emoji: "💬", title: "Team announcements feed", desc: "Coach posts a message in any language — the site translates it automatically, shows the location with a Maps link, and pulls a live weather forecast for the event." },
      ],
    },
    knownBugs: {
      badge: "🐛 Known issue",
      title: "Known bugs",
      items: [
        { emoji: "🐢", title: "Video clips load slowly", desc: "We know — we're on it. Videos will be significantly faster once we connect our domain to the CDN. Fix coming soon." },
      ],
    },
    next: {
      badge: "🔜 In progress",
      title: "Coming next",
      items: [
        { emoji: "🔥", title: "Parent photo uploads — URGENT", desc: "Let parents upload photos from games and practices directly to the gallery. Coming soon for U12." },
        { emoji: "👤", title: "Parent accounts", desc: "Register as a parent to unlock more features — no shared password needed." },
        { emoji: "🖼️", title: "Player profile photos", desc: "Upload a photo for your child's roster card." },
        { emoji: "🍊", title: "Snack signup", desc: "Replace SignUpGenius — sign up for snacks directly on the site." },
        { emoji: "🔔", title: "Game-day reminders", desc: "Push notifications before each game with time, field, and weather." },
        { emoji: "🔍", title: "Search", desc: "Search across news, announcements, schedules, and roster from anywhere on the site." },
        { emoji: "🗳️", title: "Community voting", desc: "Vote on which features matter most to you — parents and coaches each get a say." },
      ],
    },
    wishlist: {
      badge: "💡 Exploring",
      title: "On the wishlist",
      items: [
        { slug: "player-stats", emoji: "📊", title: "Player stats", desc: "Goals, assists, and appearances per player across the season." },
        { slug: "attendance-tracking", emoji: "✅", title: "Attendance tracking", desc: "Mark who showed up to practice and games." },
        { slug: "season-awards", emoji: "🏆", title: "Season awards", desc: "Vote for MVP, most improved, and best attitude at end of season." },
      ],
    },
  },
  es: {
    heading: "Próximamente",
    subheading: "Esta es la app de tu equipo — aquí verás qué está en vivo, qué estamos construyendo y hacia dónde vamos. ¿Tienes una idea? Cuéntanos abajo.",
    feedbackHeading: "Comparte tus ideas",
    feedbackBody: "¿Encontraste un error? ¿Tienes una idea? ¿Quieres que algo suba en la lista? Leemos cada mensaje.",
    live: {
      badge: "✅ En vivo",
      title: "Disponible ahora",
      items: [
        { emoji: "📅", title: "Calendario de partidos", desc: "Pronóstico del tiempo en vivo y enlace a Google Maps para cada campo." },
        { emoji: "👕", title: "Alineación del equipo", desc: "Vista de campo y lista con posiciones." },
        { emoji: "📸", title: "Galería de fotos", desc: "Álbumes de cada partido, sincronizados automáticamente desde Google Drive." },
        { emoji: "🎥", title: "Videos de partidos (KickReel)", desc: "Grabaciones 360° en calidad completa, clips y jugadas destacadas." },
        { emoji: "📆", title: "Suscripción al calendario", desc: "Suscríbete en iPhone o Google Calendar — los cambios se sincronizan automáticamente." },
        { emoji: "🌐", title: "Inglés y Español", desc: "Soporte bilingüe completo en todo el sitio." },
        { emoji: "🔒", title: "Acceso solo para familias", desc: "Videos y galería protegidos con contraseña — pídela al Entrenador Hugo." },
        { emoji: "📰", title: "Noticias y anuncios", desc: "Anuncios fijados del cuerpo técnico." },
        { emoji: "💬", title: "Feed de anuncios del equipo", desc: "El entrenador publica en cualquier idioma — el sitio lo traduce automáticamente, muestra la ubicación con enlace a Maps y el pronóstico del tiempo para el evento." },
      ],
    },
    knownBugs: {
      badge: "🐛 Error conocido",
      title: "Errores conocidos",
      items: [
        { emoji: "🐢", title: "Los videos cargan lento", desc: "Lo sabemos — ya lo estamos resolviendo. Los videos serán mucho más rápidos cuando conectemos nuestro dominio al CDN. Solución pronto." },
      ],
    },
    next: {
      badge: "🔜 En progreso",
      title: "Próximamente",
      items: [
        { emoji: "🔥", title: "Subir fotos como padre — URGENTE", desc: "Que los padres puedan subir fotos de los partidos y entrenamientos directo a la galería. Pronto para U12." },
        { emoji: "👤", title: "Cuentas para padres", desc: "Regístrate como padre para acceder a más funciones — sin contraseña compartida." },
        { emoji: "🖼️", title: "Fotos de perfil de jugadores", desc: "Sube una foto para la tarjeta de tu hijo en la alineación." },
        { emoji: "🍊", title: "Registro de snacks", desc: "Reemplaza SignUpGenius — regístrate para llevar snacks directamente en el sitio." },
        { emoji: "🔔", title: "Recordatorios del día del partido", desc: "Notificaciones antes de cada partido con hora, campo y clima." },
        { emoji: "🔍", title: "Búsqueda", desc: "Busca noticias, anuncios, calendarios y alineaciones desde cualquier parte del sitio." },
        { emoji: "🗳️", title: "Votación de la comunidad", desc: "Vota por las funciones que más te importan — padres y entrenadores tienen voz." },
      ],
    },
    wishlist: {
      badge: "💡 Explorando",
      title: "En la lista de deseos",
      items: [
        { slug: "player-stats", emoji: "📊", title: "Estadísticas de jugadores", desc: "Goles, asistencias y apariciones por jugador en la temporada." },
        { slug: "attendance-tracking", emoji: "✅", title: "Control de asistencia", desc: "Registra quién asistió a los entrenamientos y partidos." },
        { slug: "season-awards", emoji: "🏆", title: "Premios de temporada", desc: "Vota por MVP, más mejorado y mejor actitud al final de la temporada." },
      ],
    },
  },
};

function Section({ badge, title, badgeColor, items }: {
  badge: string;
  title: string;
  badgeColor: string;
  items: { emoji: string; title: string; desc: string }[];
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>{badge}</span>
        <h2 className="text-lg font-black text-gray-900">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.title} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex gap-3">
            <span className="text-2xl leading-none mt-0.5">{item.emoji}</span>
            <div>
              <p className="font-bold text-gray-800 text-sm">{item.title}</p>
              <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function RoadmapPage() {
  const [locale, initialVotes] = await Promise.all([getLocale(), getAllVotes()]);
  const c = locale === "es" ? CONTENT.es : CONTENT.en;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">{c.heading}</h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xl">{c.subheading}</p>
      </div>

      <Section badge={c.live.badge} title={c.live.title} badgeColor="bg-green-100 text-green-700" items={c.live.items} />
      <Section badge={c.knownBugs.badge} title={c.knownBugs.title} badgeColor="bg-red-100 text-red-700" items={c.knownBugs.items} />
      <Section badge={c.next.badge} title={c.next.title} badgeColor="bg-blue-100 text-blue-700" items={c.next.items} />
      <WishlistSection badge={c.wishlist.badge} title={c.wishlist.title} items={c.wishlist.items} initialVotes={initialVotes} />

      <section className="bg-gray-50 border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-black text-gray-900 mb-1">{c.feedbackHeading}</h2>
        <p className="text-sm text-gray-500 mb-5">{c.feedbackBody}</p>
        <FeedbackForm />
      </section>
    </div>
  );
}
