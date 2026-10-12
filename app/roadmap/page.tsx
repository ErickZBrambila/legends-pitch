import type { Metadata } from "next";
import FeedbackForm from "./FeedbackForm";

export const metadata: Metadata = {
  title: "What's Coming · North Legends FC",
  description: "See what's live on the North Legends FC app, what we're building next, and share your ideas.",
};

const LIVE = [
  { emoji: "📅", title: "Game schedule", desc: "Live weather forecasts and Google Maps links for every field." },
  { emoji: "👕", title: "Team roster", desc: "Field view and list view with positions." },
  { emoji: "📸", title: "Photo gallery", desc: "Albums from every game, auto-synced from Google Drive." },
  { emoji: "🎥", title: "Match videos (KickReel)", desc: "Full-quality 360° footage, clips, and highlights." },
  { emoji: "📆", title: "Calendar subscription", desc: "Subscribe on iPhone or Google Calendar — updates push automatically." },
  { emoji: "🌐", title: "English & Spanish", desc: "Full bilingual support across the entire site." },
  { emoji: "🔒", title: "Family-only access", desc: "Videos and gallery are passcode-protected — ask Coach Hugo for the code." },
  { emoji: "📰", title: "News & announcements", desc: "Pinned announcements from the coaching staff." },
];

const NEXT = [
  { emoji: "👤", title: "Parent accounts", desc: "Register as a parent to unlock more features — no shared password needed." },
  { emoji: "🖼️", title: "Player profile photos", desc: "Upload a photo for your child's roster card." },
  { emoji: "🍊", title: "Snack signup", desc: "Replace SignUpGenius — sign up for snacks directly on the site." },
  { emoji: "🔔", title: "Game-day reminders", desc: "Push notifications before each game with time, field, and weather." },
];

const WISHLIST = [
  { emoji: "💬", title: "Team announcements feed", desc: "Coach posts updates, parents react — no more group chat chaos." },
  { emoji: "📊", title: "Player stats", desc: "Goals, assists, and appearances per player across the season." },
  { emoji: "✅", title: "Attendance tracking", desc: "Mark who showed up to practice and games." },
  { emoji: "🏆", title: "Season awards", desc: "Vote for MVP, most improved, and best attitude at end of season." },
];

function Section({ title, badge, items, badgeColor }: {
  title: string;
  badge: string;
  items: { emoji: string; title: string; desc: string }[];
  badgeColor: string;
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

export default function RoadmapPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">What&apos;s Coming</h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
          This is your team&apos;s app — here&apos;s what&apos;s live, what we&apos;re building next,
          and where we want to take it. Got an idea? Tell us at the bottom. ·{" "}
          <span className="text-gray-400">Esta es la app de tu equipo. ¿Tienes una idea? Dinos abajo.</span>
        </p>
      </div>

      <Section
        title="Live now"
        badge="✅ Live"
        badgeColor="bg-green-100 text-green-700"
        items={LIVE}
      />
      <Section
        title="Coming next"
        badge="🔜 In progress"
        badgeColor="bg-blue-100 text-blue-700"
        items={NEXT}
      />
      <Section
        title="On the wishlist"
        badge="💡 Exploring"
        badgeColor="bg-yellow-100 text-yellow-700"
        items={WISHLIST}
      />

      {/* Feedback */}
      <section className="bg-gray-50 border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-black text-gray-900 mb-1">Share your ideas · Comparte tus ideas</h2>
        <p className="text-sm text-gray-500 mb-5">
          Found a bug? Have a feature idea? Want something moved up the list? We read every message.
        </p>
        <FeedbackForm />
      </section>
    </div>
  );
}
