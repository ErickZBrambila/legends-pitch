import { NextRequest, NextResponse } from "next/server";
import { Client as QStash } from "@upstash/qstash";
import { getGotSportData } from "@/lib/data/gotsport";
import type { Match } from "@/lib/types";
import type { ResultCheckerPayload } from "@/app/api/cron/result-checker/route";
import type { GameDayPushPayload } from "@/app/api/cron/game-day-push/route";

// Look ahead 28 hours so a 4am run catches games up to ~8am the next morning edge case
const WINDOW_MS = 28 * 60 * 60 * 1000;
const REMINDER_BEFORE_KICKOFF_S = 2 * 60 * 60; // 2 hours

function appUrl() {
  return process.env.APP_URL ?? "https://legends-pitch.vercel.app";
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const qstashToken = process.env.QSTASH_TOKEN;
  if (!qstashToken) {
    return NextResponse.json({ error: "QSTASH_TOKEN not set" }, { status: 500 });
  }
  const qstash = new QStash({ token: qstashToken, baseUrl: process.env.QSTASH_URL });

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
    return NextResponse.json({ ok: true, queued: 0, message: "No games today" });
  }

  let queued = 0;

  for (const m of upcoming) {
    const kickoffMs = new Date(m.date).getTime();

    // Schedule push reminder 2 hours before kickoff
    const reminderDelaySec = Math.max(0, Math.round((kickoffMs - Date.now()) / 1000) - REMINDER_BEFORE_KICKOFF_S);
    const pushPayload: GameDayPushPayload = {
      team: m.team,
      opponent: m.opponent,
      kickoffIso: m.date,
      homeAway: m.homeAway,
      location: m.location,
    };
    await qstash.publishJSON({
      url: `${appUrl()}/api/cron/game-day-push`,
      delay: reminderDelaySec,
      body: pushPayload,
    });

    // Schedule result-checker 90 min after kickoff
    const checkerDelaySec = Math.max(0, Math.round((kickoffMs - Date.now()) / 1000) + 90 * 60);
    const checkerPayload: ResultCheckerPayload = {
      team: m.team.toLowerCase() as "u11" | "u12",
      matchId: m.id,
      kickoffIso: m.date,
      opponent: m.opponent,
    };
    await qstash.publishJSON({
      url: `${appUrl()}/api/cron/result-checker`,
      delay: checkerDelaySec,
      body: checkerPayload,
    });

    queued++;
  }

  return NextResponse.json({ ok: true, games: upcoming.length, queued });
}
