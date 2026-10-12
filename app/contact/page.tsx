import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import TeamTabs from "@/components/TeamTabs";
import { getCoachSubmission } from "@/lib/sanity/queries";
import type { TeamSlug } from "@/lib/sanity/queries";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Contact");
  return { title: t("metaTitle") };
}

const FIELD_ADDRESS = "Frost Elementary School, 711 Lakeway Dr, Georgetown, TX 78628";
const MAPS_EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(FIELD_ADDRESS)}&output=embed&z=15`;

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const team: TeamSlug = teamParam === "u12" ? "u12" : "u11";

  const [t, info] = await Promise.all([
    getTranslations("Contact"),
    getCoachSubmission(team),
  ]);

  const email = info?.headCoachEmail ?? "legendsfcnorth@gmail.com";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black text-gray-900">{t("heading")}</h1>
        <TeamTabs activeTeam={team} />
      </div>

      {/* Coach feature card */}
      <div className="bg-[var(--color-navy)] text-white rounded-2xl overflow-hidden shadow-lg mb-8">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-56 h-56 md:h-auto flex-shrink-0">
            <Image
              src="/coach-hugo.jpg"
              alt="Coach Hugo"
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 224px"
            />
          </div>
          <div className="p-6 md:p-8 flex flex-col justify-between gap-5">
            <div>
              <p className="text-[var(--color-accent)] text-xs uppercase tracking-widest font-semibold mb-1">
                {t("meetTheCoach")}
              </p>
              <h2 className="text-2xl font-black mb-3">{t("coachHugoName")}</h2>
              <p className="text-gray-300 text-sm leading-relaxed">{t("coachHugoBio")}</p>
            </div>
            <div className="border-t border-white/10 pt-5">
              <p className="text-[var(--color-accent)] text-xs uppercase tracking-widest font-semibold mb-2">
                {t("coachingPhilosophy")}
              </p>
              <p className="text-gray-300 text-sm leading-relaxed italic">
                {t("coachingPhilosophyBody")}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl px-5 py-4">
              <p className="text-gray-200 text-sm italic leading-relaxed">{t("parentTestimonial")}</p>
              <p className="text-gray-400 text-xs mt-2">{t("parentTestimonialAuthor")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Practice schedule */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            {t("practiceSchedule")}
          </h2>
          <div className="flex flex-col gap-3">
            {info?.practiceSlots?.length ? (
              info.practiceSlots.map((s, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <p className="font-semibold text-gray-700 text-sm">{s.day.trim()}</p>
                  <p className="text-gray-500 text-sm">{s.time}</p>
                  <p className="text-gray-400 text-xs">{s.location}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">Schedule coming soon.</p>
            )}
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
            {t("coachingStaff")}
          </h2>
          <div className="flex flex-col gap-3">
            {info ? (
              <>
                <div>
                  <p className="font-semibold text-gray-700 text-sm">{info.headCoachName}</p>
                  <p className="text-gray-400 text-xs">{t("headCoach")}</p>
                </div>
                {info.assistants?.map((a, i) => (
                  <div key={i}>
                    <p className="font-semibold text-gray-700 text-sm">{a.name.trim()}</p>
                    <p className="text-gray-400 text-xs">{t("assistantCoach")}</p>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-gray-400 text-sm">{t("headCoachTbd")}</p>
            )}
          </div>
        </div>

        {/* Get in touch */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            {t("getInTouch")}
          </h2>
          <p className="text-gray-500 text-sm mb-3">{t("getInTouchBody")}</p>
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[#1c1c1e] text-sm font-bold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors"
          >
            {email}
          </a>
        </div>

        {/* Home field */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            {t("homeField")}
          </h2>
          <p className="text-gray-700 text-sm font-semibold mb-1">{t("fieldName")}</p>
          <p className="text-gray-400 text-xs mb-3">711 Lakeway Dr, Georgetown, TX 78628</p>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(FIELD_ADDRESS)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] text-sm font-semibold hover:underline"
          >
            {t("openInMaps")}
          </a>
        </div>
      </div>

      {/* Map embed */}
      <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 h-64 md:h-80">
        <iframe
          src={MAPS_EMBED}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={t("mapTitle")}
        />
      </div>
    </div>
  );
}
