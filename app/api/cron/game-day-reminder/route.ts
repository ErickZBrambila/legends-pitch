import { NextRequest, NextResponse } from "next/server";
import { broadcastPush } from "@/lib/push";
import { getGotSportData } from "@/lib/data/gotsport";
import type { Match } from "@/lib/types";

// Time window: notify for matches starting within the next 24 hours
const WINDOW_MS = 24 * 60 * 60 * 1000;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
}

export async function GET(req: NextRequest) {
  // Vercel injects Authorization: Bearer <CRON_SECRET> automatically for cron calls
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const cutoff = now + WINDOW_MS;

  const [u11, u12] = await Promise.all([
    getGotSportData("u11"),
    getGotSportData("u12"),
  ]);

  const upcoming: Array<Match & { team: "U11" | "U12" }> = [
    ...u11.matches.map((m) => ({ ...m, team: "U11" as const })),
    ...u12.matches.map((m) => ({ ...m, team: "U12" as const })),
  ].filter((m) => {
    const ms = new Date(m.date).getTime();
    return ms >= now && ms <= cutoff;
  });

  if (upcoming.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No games today" });
  }

  let totalSent = 0;

  for (const m of upcoming) {
    const time = formatTime(m.date);
    const homeAway = m.homeAway === "home" ? "🏠 Home" : "✈️ Away";
    const title = `⚽ Game Day — ${m.team} vs ${m.opponent}`;
    const body = `${time} · ${homeAway} · ${m.location}`;
    const sent = await broadcastPush(title, body, "/schedule");
    totalSent += sent;
  }

  return NextResponse.json({ ok: true, sent: totalSent, games: upcoming.length });
}
