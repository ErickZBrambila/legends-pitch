import { NextRequest, NextResponse } from "next/server";
import { broadcastPush } from "@/lib/push";
import { verifyQStashRequest } from "@/lib/qstash-verify";

export interface GameDayPushPayload {
  team: "U11" | "U12";
  opponent: string;
  kickoffIso: string;
  homeAway: "home" | "away";
  location: string;
}

function isValidPayload(p: unknown): p is GameDayPushPayload {
  if (typeof p !== "object" || p === null) return false;
  const o = p as Record<string, unknown>;
  return (
    (o.team === "U11" || o.team === "U12") &&
    (o.homeAway === "home" || o.homeAway === "away") &&
    typeof o.opponent === "string" && o.opponent.length <= 100 &&
    typeof o.location === "string" && o.location.length <= 200 &&
    typeof o.kickoffIso === "string" && !isNaN(Date.parse(o.kickoffIso))
  );
}

export async function POST(req: NextRequest) {
  // Verify the request really came from QStash before doing anything.
  const verified = await verifyQStashRequest(req);
  if ("error" in verified) return verified.error;

  let payload: unknown;
  try {
    payload = JSON.parse(verified.body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { team, opponent, kickoffIso, homeAway, location } = payload;

  const time = new Date(kickoffIso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });

  const homeAwayLabel = homeAway === "home" ? "🏠 Home" : "✈️ Away";
  const title = `⚽ Game Day — ${team} vs ${opponent}`;
  const body = `${time} · ${homeAwayLabel} · ${location}`;

  const sent = await broadcastPush(title, body, "/schedule");

  return NextResponse.json({ ok: true, sent });
}
