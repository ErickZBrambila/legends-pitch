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

  const team = req.nextUrl.searchParams.get("team") as TeamSlug | null;
  if (team !== "u11" && team !== "u12") {
    return NextResponse.json({ error: "team must be u11 or u12" }, { status: 400 });
  }

  const data = await refreshGotSportCache(team);
  return NextResponse.json({
    ok: true,
    team,
    matchCount: data.matches.length,
    source: data.source,
  });
}
