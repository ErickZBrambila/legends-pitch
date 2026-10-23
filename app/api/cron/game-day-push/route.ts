import { NextRequest, NextResponse } from "next/server";
import { broadcastPush } from "@/lib/push";

export interface GameDayPushPayload {
  team: "U11" | "U12";
  opponent: string;
  kickoffIso: string;
  homeAway: "home" | "away";
  location: string;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("upstash-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing QStash signature" }, { status: 401 });
  }

  let payload: GameDayPushPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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
