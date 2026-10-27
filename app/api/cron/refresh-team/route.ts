import { NextRequest, NextResponse } from "next/server";
import type { TeamSlug } from "@/lib/sanity/queries";
import { refreshGotSportCache } from "@/lib/data/gotsport";

// Needs extra time for Chromium launch + page render
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamParam = req.nextUrl.searchParams.get("team");

  // "all" (or no param) refreshes both teams — used by the single daily Vercel cron
  const teams: TeamSlug[] =
    teamParam === "u11" || teamParam === "u12" ? [teamParam] : ["u11", "u12"];

  const results = await Promise.all(
    teams.map(async (team) => {
      const data = await refreshGotSportCache(team);
      return { team, matchCount: data.matches.length, source: data.source };
    })
  );

  return NextResponse.json({ ok: true, results });
}
