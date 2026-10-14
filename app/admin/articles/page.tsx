import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import ArticlesAdmin from "./ArticlesAdmin";
import { getMatchesByTeam, getPostsByTeamAdmin, purgeOldDrafts } from "@/lib/sanity/queries";

export const metadata = { title: "Match Articles · Admin" };

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const authed = await getAdminSession();
  if (!authed) redirect("/admin");

  const { team: teamParam } = await searchParams;
  const team = teamParam === "u12" ? "u12" : ("u11" as const);

  const [[matches, posts]] = await Promise.all([
    Promise.all([getMatchesByTeam(team), getPostsByTeamAdmin(team)]),
    purgeOldDrafts(),
  ]);

  return <ArticlesAdmin team={team} matches={matches} posts={posts} />;
}
