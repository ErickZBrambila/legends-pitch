import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { sanityWriteClient } from "@/lib/sanity/client";
import type { MatchResult } from "@/lib/types";

export async function POST(req: NextRequest) {
  const authed = await getAdminSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { matchId, homeAway, homeGoals, awayGoals } = await req.json();
  if (!matchId || homeGoals == null || awayGoals == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const goalsFor = homeAway === "home" ? homeGoals : awayGoals;
  const goalsAgainst = homeAway === "home" ? awayGoals : homeGoals;
  const result: MatchResult =
    goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "L" : "D";

  try {
    await sanityWriteClient.patch(matchId).set({ goalsFor, goalsAgainst, result }).commit();
  } catch (err) {
    console.error("Sanity patch failed:", err);
    return NextResponse.json({ error: "Failed to update match" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result });
}
