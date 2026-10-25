import { NextResponse } from "next/server";
import { getParentSession, getPlayerOwners } from "@/lib/parent-auth";
import { getPlayersByTeam } from "@/lib/sanity/queries";

export async function GET() {
  const account = await getParentSession();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [u11, u12] = await Promise.all([
    getPlayersByTeam("u11"),
    getPlayersByTeam("u12"),
  ]);

  const allPlayers = [
    ...u11.map((p) => ({ ...p, team: "U11" as const })),
    ...u12.map((p) => ({ ...p, team: "U12" as const })),
  ];

  const withStatus = await Promise.all(
    allPlayers.map(async (p) => {
      const owners = await getPlayerOwners(p.id);
      return {
        ...p,
        claimedByMe: owners.includes(account.id),
        // "claimed" means at capacity (2 parents) and I'm not one of them
        claimed: owners.length >= 2 && !owners.includes(account.id),
      };
    }),
  );

  return NextResponse.json(withStatus);
}
