import { NextRequest, NextResponse } from "next/server";
import { Client as QStash } from "@upstash/qstash";
import { broadcastPush } from "@/lib/push";
import { getGotSportData } from "@/lib/data/gotsport";
import type { Match } from "@/lib/types";
import type { ResultCheckerPayload } from "@/app/api/cron/result-checker/route";

// Time window: notify for matches starting within the next 24 hours
const WINDOW_MS = 24 * 60 * 60 * 1000;

function appUrl() {
  return process.env.APP_URL ?? "https://legends-pitch.vercel.app";
}

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
  let queued = 0;

  const qstashToken = process.env.QSTASH_TOKEN;
  const qstash = qstashToken ? new QStash({ token: qstashToken, baseUrl: process.env.QSTASH_URL }) : null;

  for (const m of upcoming) {
    const time = formatTime(m.date);
    const homeAway = m.homeAway === "home" ? "🏠 Home" : "✈️ Away";
    const title = `⚽ Game Day — ${m.team} vs ${m.opponent}`;
    const body = `${time} · ${homeAway} · ${m.location}`;
    const sent = await broadcastPush(title, body, "/schedule");
    totalSent += sent;

    // Schedule the result-checker to fire 90 min after kickoff
    if (qstash) {
      const kickoffMs = new Date(m.date).getTime();
      const delaySec = Math.max(0, Math.round((kickoffMs - Date.now()) / 1000) + 90 * 60);
      const checkerPayload: ResultCheckerPayload = {
        team: m.team.toLowerCase() as "u11" | "u12",
        matchId: m.id,
        kickoffIso: m.date,
        opponent: m.opponent,
      };
      await qstash.publishJSON({
        url: `${appUrl()}/api/cron/result-checker`,
        delay: delaySec,
        body: checkerPayload,
      });
      queued++;
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, games: upcoming.length, queued });
}
