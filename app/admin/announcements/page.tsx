import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import AnnouncementsAdmin from "./AnnouncementsAdmin";
import { getAllAnnouncements } from "@/lib/sanity/queries";

export const metadata = { title: "Announcements · Admin" };

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const authed = await getAdminSession();
  if (!authed) redirect("/admin");

  const { team: teamParam } = await searchParams;
  const team = teamParam === "u12" ? "u12" : ("u11" as const);

  const announcements = await getAllAnnouncements(team);

  return <AnnouncementsAdmin initialAnnouncements={announcements} team={team} />;
}
