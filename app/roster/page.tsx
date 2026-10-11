import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import TeamTabs from "@/components/TeamTabs";
import RosterView from "@/components/RosterView";
import { getPlayersByTeam, getTeamLabel } from "@/lib/sanity/queries";
import type { TeamSlug } from "@/lib/sanity/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Roster");
  return { title: t("metaTitle") };
}

export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const team: TeamSlug = teamParam === "u12" ? "u12" : "u11";

  const t = await getTranslations("Roster");

  const [players, label] = await Promise.all([
    getPlayersByTeam(team),
    getTeamLabel(team),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h1 className="text-3xl font-black text-gray-900">{t("heading")}</h1>
        <TeamTabs activeTeam={team} />
      </div>
      <p className="text-gray-500 text-sm mb-8">{label}</p>

      {players.length === 0 ? (
        <p className="text-gray-400 text-center py-20">
          {t("noPlayers")}
        </p>
      ) : (
        <RosterView players={players} />
      )}
    </div>
  );
}
