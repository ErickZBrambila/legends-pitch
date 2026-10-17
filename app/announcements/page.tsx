import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import TeamTabs from "@/components/TeamTabs";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { getAllAnnouncements } from "@/lib/sanity/queries";
import type { TeamSlug } from "@/lib/sanity/queries";
import type { Announcement } from "@/lib/types";

export const metadata: Metadata = { title: "Announcements · North Legends FC" };

function isExpired(a: Announcement) {
  return !!a.expiresAt && new Date(a.expiresAt) <= new Date();
}

function isScheduled(a: Announcement) {
  return !!a.publishesAt && new Date(a.publishesAt) > new Date();
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const team: TeamSlug = teamParam === "u12" ? "u12" : "u11";
  const locale = await getLocale();
  const all = await getAllAnnouncements(team);

  const active = all.filter((a) => !isExpired(a) && !isScheduled(a));
  const archived = all.filter((a) => isExpired(a));

  const headingArchive = locale === "es" ? "Anuncios anteriores" : "Past Announcements";
  const headingActive = locale === "es" ? "Anuncios" : "Announcements";
  const noActive = locale === "es" ? "No hay anuncios activos." : "No active announcements.";
  const noAll = locale === "es" ? "Sin anuncios aún." : "No announcements yet.";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black text-gray-900">{headingActive}</h1>
        <TeamTabs activeTeam={team} />
      </div>

      {all.length === 0 ? (
        <p className="text-gray-400 text-center py-20">{noAll}</p>
      ) : (
        <>
          {active.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">{noActive}</p>
          ) : (
            <div className="flex flex-col gap-4 mb-10">
              {active.map((a) => (
                <AnnouncementBanner key={a.id} announcement={a} locale={locale} />
              ))}
            </div>
          )}

          {archived.length > 0 && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{headingArchive}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="flex flex-col gap-4 opacity-60">
                {archived.map((a) => (
                  <AnnouncementBanner key={a.id} announcement={a} locale={locale} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
