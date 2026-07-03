import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact" };

const PRACTICE_SCHEDULE = [
  { day: "Tuesday", time: "6:30 – 7:30 PM", location: "Jarrell Elementary School" },
  { day: "Thursday", time: "6:30 – 7:30 PM", location: "Jarrell Elementary School" },
];

const COACHING_STAFF = [
  { name: "Head Coach (TBD)", role: "Head Coach" },
  { name: "Assistant Coach (TBD)", role: "Assistant Coach" },
];

const CONTACT_EMAIL = "northlegends@gmail.com";
const FIELD_ADDRESS = "Frost Elementary School, 711 Lakeway Dr, Georgetown, TX 78628";
const MAPS_EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(FIELD_ADDRESS)}&output=embed&z=15`;

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-900 mb-8">Contact & Info</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Practice schedule */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            Practice Schedule
          </h2>
          <div className="flex flex-col gap-3">
            {PRACTICE_SCHEDULE.map((s, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <p className="font-semibold text-gray-700 text-sm">{s.day}</p>
                <p className="text-gray-500 text-sm">{s.time}</p>
                <p className="text-gray-400 text-xs">{s.location}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Coaching staff */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            Coaching Staff
          </h2>
          <div className="flex flex-col gap-3">
            {COACHING_STAFF.map((c, i) => (
              <div key={i}>
                <p className="font-semibold text-gray-700 text-sm">{c.name}</p>
                <p className="text-gray-400 text-xs">{c.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            Get in Touch
          </h2>
          <p className="text-gray-500 text-sm mb-3">
            Questions about the team, schedule, or anything else? Reach out!
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[#1c1c1e] text-sm font-bold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        {/* Field address */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            Home Field
          </h2>
          <p className="text-gray-700 text-sm font-semibold mb-1">Frost Elementary School</p>
          <p className="text-gray-400 text-xs mb-3">711 Lakeway Dr, Georgetown, TX 78628</p>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(FIELD_ADDRESS)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] text-sm font-semibold hover:underline"
          >
            Open in Maps →
          </a>
        </div>
      </div>

      {/* Map embed placeholder */}
      <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 h-64 md:h-80 flex items-center justify-center">
        <iframe
          src={MAPS_EMBED}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Home field map"
        />
      </div>
    </div>
  );
}
