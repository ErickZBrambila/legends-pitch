import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import ArticlesAdmin from "./ArticlesAdmin";
import { getMatchesByTeam, getPostsByTeamAdmin } from "@/lib/sanity/queries";

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

  const [matches, posts] = await Promise.all([
    getMatchesByTeam(team),
    getPostsByTeamAdmin(team),
  ]);

  const completedMatches = matches.filter((m) => m.result !== null);

  return <ArticlesAdmin team={team} matches={completedMatches} posts={posts} />;
}
