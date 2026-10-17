import { NextResponse } from "next/server";
import { getParentSession, getPlayerOwner } from "@/lib/parent-auth";
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
      const owner = await getPlayerOwner(p.id);
      return {
        ...p,
        claimedByMe: owner === account.id,
        claimed: owner !== null,
      };
    }),
  );

  return NextResponse.json(withStatus);
}
