import { getPlayersByTeam } from "@/lib/sanity/queries";
import { getGotSportData } from "@/lib/data/gotsport";
import TrackerApp from "./TrackerApp";
import { requireFamilyAccess } from "@/lib/family-access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Game Tracker · North Legends FC" };

export default async function TrackerPage() {
  // Server-side gate (don't rely on middleware alone for kids' media).
  await requireFamilyAccess("/tracker");

  const [u11Players, u11Data, u12Players, u12Data] = await Promise.all([
    getPlayersByTeam("u11"),
    getGotSportData("u11"),
    getPlayersByTeam("u12"),
    getGotSportData("u12"),
  ]);
  const u11Matches = u11Data.matches;
  const u12Matches = u12Data.matches;

  return (
    <TrackerApp
      teams={{
        u11: { players: u11Players, matches: u11Matches },
        u12: { players: u12Players, matches: u12Matches },
      }}
    />
  );
}
