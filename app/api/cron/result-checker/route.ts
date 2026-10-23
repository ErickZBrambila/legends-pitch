import { NextRequest, NextResponse } from "next/server";
import { Client as QStash } from "@upstash/qstash";
import { broadcastPush } from "@/lib/push";
import { getGotSportData } from "@/lib/data/gotsport";

const GOTSPORT_URLS: Record<string, string> = {
  u11: "https://system.gotsport.com/org_event/events/55587/schedules?team=4373770",
  u12: "https://system.gotsport.com/org_event/events/55587/schedules?team=4373769",
};

// Maximum time to keep chasing a result after kickoff
const MAX_CHASE_MS = 8 * 60 * 60 * 1000;
const RETRY_DELAY_S = 60 * 60; // 1 hour

// Dec 23, 2026 midnight CST = Dec 24 06:00 UTC
const SEASON_END_MS = new Date("2026-12-24T06:00:00Z").getTime();

function appUrl() {
  return process.env.APP_URL ?? "https://legends-pitch.vercel.app";
}

function getQStash() {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error("QSTASH_TOKEN not set");
  return new QStash({ token, baseUrl: process.env.QSTASH_URL });
}

async function scrapeGotSportResult(
  team: string,
  matchDate: string,
  opponent: string
): Promise<{ goalsFor: number; goalsAgainst: number } | null> {
  const url = GOTSPORT_URLS[team];
  if (!url) return null;

  let html: string;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  const dateStr = new Date(matchDate).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago",
  });

  const dateIdx = html.indexOf(dateStr);
  if (dateIdx === -1) return null;

  const chunk = html.slice(dateIdx, dateIdx + 2000);
  const scoreMatch = chunk.match(/(\d{1,2})\s*-\s*(\d{1,2})/);
  if (!scoreMatch) return null;

  const legendsFirst =
    chunk.indexOf("JYSA North Legends") < chunk.indexOf(opponent.split(" ")[0]);
  const a = parseInt(scoreMatch[1], 10);
  const b = parseInt(scoreMatch[2], 10);

  return legendsFirst
    ? { goalsFor: a, goalsAgainst: b }
    : { goalsFor: b, goalsAgainst: a };
}

// Payload shape published by game-day-reminder and re-published by this route
export interface ResultCheckerPayload {
  team: "u11" | "u12";
  matchId: string;
  kickoffIso: string;
  opponent: string;
}

export async function POST(req: NextRequest) {
  // Verify request came from QStash
  const sig = req.headers.get("upstash-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing QStash signature" }, { status: 401 });
  }

  let payload: ResultCheckerPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { team, matchId, kickoffIso, opponent } = payload;
  const now = Date.now();

  if (now >= SEASON_END_MS) {
    console.log(`[result-checker] Season over — dropping ${matchId}`);
    return NextResponse.json({ ok: true, action: "season-over" });
  }

  const kickoffMs = new Date(kickoffIso).getTime();
  const elapsed = now - kickoffMs;

  // Hard stop — don't chase forever
  if (elapsed > MAX_CHASE_MS) {
    console.log(`[result-checker] Giving up on ${team} ${matchId} after 8 h`);
    return NextResponse.json({ ok: true, action: "gave-up" });
  }

  // Check whether the result has already been entered in our data
  const { matches } = await getGotSportData(team);
  const match = matches.find((m) => m.id === matchId);
  if (match?.result !== null) {
    console.log(`[result-checker] Result already in app for ${matchId}, stopping`);
    return NextResponse.json({ ok: true, action: "already-entered" });
  }

  // Try to scrape live result from GotSport
  const scraped = await scrapeGotSportResult(team, kickoffIso, opponent);

  if (!scraped) {
    // Not posted yet — re-queue for 30 min from now
    const qstash = getQStash();
    await qstash.publishJSON({
      url: `${appUrl()}/api/cron/result-checker`,
      delay: RETRY_DELAY_S,
      body: payload,
    });
    console.log(`[result-checker] No result yet for ${matchId}, retrying in 1 h`);
    return NextResponse.json({ ok: true, action: "retrying" });
  }

  // Result found — push to subscribers and stop
  const { goalsFor, goalsAgainst } = scraped;
  const result = goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "L" : "D";
  const label = team.toUpperCase();

  const title = `⚽ ${label} Result — vs ${opponent}`;
  const body  = `${goalsFor}–${goalsAgainst} ${result === "W" ? "Win" : result === "L" ? "Loss" : "Draw"} · Update the app`;

  await broadcastPush(title, body, "/schedule");
  console.log(`[result-checker] Result pushed for ${matchId}: ${goalsFor}-${goalsAgainst}`);

  return NextResponse.json({ ok: true, action: "pushed", goalsFor, goalsAgainst, result });
}
