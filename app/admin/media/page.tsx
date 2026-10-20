import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getGalleryEventsByTeam, getHighlightVideosByTeam } from "@/lib/sanity/queries";
import MediaAdmin from "./MediaAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "⚙ Media · Admin" };

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const authed = await getAdminSession();
  if (!authed) redirect("/admin");

  const { team: teamParam } = await searchParams;
  const team = teamParam === "u12" ? "u12" : ("u11" as const);

  const [albums, videos, locale] = await Promise.all([
    getGalleryEventsByTeam(team),
    getHighlightVideosByTeam(team),
    getLocale(),
  ]);

  return (
    <MediaAdmin
      key={team}
      team={team}
      locale={locale}
      initialAlbums={albums}
      initialVideos={videos}
    />
  );
}
