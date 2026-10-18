import { getPlayersByTeam, getMatchesByTeam } from "@/lib/sanity/queries";
import TrackerApp from "./TrackerApp";

export const dynamic = "force-dynamic";
export const metadata = { title: "Game Tracker · North Legends FC" };

export default async function TrackerPage() {
  const [u11Players, u11Matches, u12Players, u12Matches] = await Promise.all([
    getPlayersByTeam("u11"),
    getMatchesByTeam("u11"),
    getPlayersByTeam("u12"),
    getMatchesByTeam("u12"),
  ]);

  return (
    <TrackerApp
      teams={{
        u11: { players: u11Players, matches: u11Matches },
        u12: { players: u12Players, matches: u12Matches },
      }}
    />
  );
}
