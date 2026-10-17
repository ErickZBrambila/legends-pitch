import { NextRequest, NextResponse } from "next/server";
import { broadcastPush } from "@/lib/push";
import { getGotSportData } from "@/lib/data/gotsport";
import type { Match } from "@/lib/types";

const GOTSPORT_URLS: Record<string, string> = {
  u11: "https://system.gotsport.com/org_event/events/55587/schedules?team=4373770",
};

// Only chase results within this window after kickoff
const MIN_WAIT_MS  = 60  * 60 * 1000; // start checking 1 h after kickoff
const MAX_CHASE_MS = 8   * 60 * 60 * 1000; // give up after 8 h

function formatScore(gf: number, ga: number, result: string) {
  return `${gf}–${ga} (${result})`;
}

// Scrape GotSport HTML to find a posted score for a given match.
// Returns { goalsFor, goalsAgainst } or null if not yet posted.
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

  // Build a short date string to locate the right row, e.g. "Oct 17, 2026"
  const gameDate = new Date(matchDate);
  const dateStr = gameDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  });

  // Find the match block for this date. GotSport embeds date + score in the
  // same table row region. We look for the date string, then extract the first
  // "N - N" score pattern that follows it within the next ~2 kb of HTML.
  const dateIdx = html.indexOf(dateStr);
  if (dateIdx === -1) return null;

  const chunk = html.slice(dateIdx, dateIdx + 2000);

  // Score pattern: one or two digits, space-dash-space, one or two digits
  const scoreMatch = chunk.match(/(\d{1,2})\s*-\s*(\d{1,2})/);
  if (!scoreMatch) return null;

  // GotSport shows scores as "Home - Away". Figure out which side we are.
  // We search for our team name ("JYSA North Legends") vs the opponent in the chunk.
  const legendsFirst = chunk.indexOf("JYSA North Legends") < chunk.indexOf(opponent.split(" ")[0]);
  const rawHome = parseInt(scoreMatch[1], 10);
  const rawAway = parseInt(scoreMatch[2], 10);

  return legendsFirst
    ? { goalsFor: rawHome, goalsAgainst: rawAway }
    : { goalsFor: rawAway,  goalsAgainst: rawHome };
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();

  const [u11, u12] = await Promise.all([
    getGotSportData("u11"),
    getGotSportData("u12"),
  ]);

  // Matches with no result yet whose kickoff was between 1 h and 8 h ago
  const pending: Array<Match & { team: "u11" | "u12" }> = [
    ...u11.matches.map((m) => ({ ...m, team: "u11" as const })),
    ...u12.matches.map((m) => ({ ...m, team: "u12" as const })),
  ].filter((m) => {
    if (m.result !== null) return false;
    const elapsed = now - new Date(m.date).getTime();
    return elapsed >= MIN_WAIT_MS && elapsed <= MAX_CHASE_MS;
  });

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, message: "No pending results" });
  }

  let pushed = 0;

  for (const m of pending) {
    const scraped = await scrapeGotSportResult(m.team, m.date, m.opponent);

    if (!scraped) {
      // Result not on GotSport yet — retry next tick
      console.log(`[result-checker] No result yet on GotSport for ${m.team} vs ${m.opponent}`);
      continue;
    }

    const { goalsFor, goalsAgainst } = scraped;
    const result: "W" | "L" | "D" =
      goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "L" : "D";
    const label = m.team.toUpperCase();
    const score = formatScore(goalsFor, goalsAgainst, result);

    const title = `⚽ Result in — ${label} vs ${m.opponent}`;
    const body  = `${score} · Update results in the app`;

    const sent = await broadcastPush(title, body, "/schedule");
    pushed += sent;

    console.log(`[result-checker] Pushed result for ${label} vs ${m.opponent}: ${score} (${sent} devices)`);
  }

  return NextResponse.json({ ok: true, checked: pending.length, pushed });
}
