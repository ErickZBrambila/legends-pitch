import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import TeamTabs from "@/components/TeamTabs";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { getAllAnnouncements } from "@/lib/sanity/queries";
import type { TeamSlug } from "@/lib/sanity/queries";

export const metadata: Metadata = { title: "Announcements · North Legends FC" };

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const team: TeamSlug = teamParam === "u12" ? "u12" : "u11";
  const locale = await getLocale();
  const announcements = await getAllAnnouncements(team);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black text-gray-900">Announcements</h1>
        <TeamTabs activeTeam={team} />
      </div>

      {announcements.length === 0 ? (
        <p className="text-gray-400 text-center py-20">No announcements yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((a) => (
            <AnnouncementBanner key={a.id} announcement={a} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
