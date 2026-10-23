import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import type { TrackerGame } from "@/lib/types";

const TTL_SECONDS = 60 * 24 * 60 * 60; // 60 days

export async function POST(req: NextRequest) {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });

  let game: TrackerGame;
  try {
    game = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!game.gameId || !game.opponent || !["u11", "u12"].includes(game.teamAgeGroup)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!Array.isArray(game.events) || game.events.length > 500) {
    return NextResponse.json({ error: "Invalid events" }, { status: 400 });
  }

  // Deduplicate index in case of retry
  await redis.lrem("tracker:game:index", 0, game.gameId);
  await Promise.all([
    redis.set(`tracker:game:${game.gameId}`, JSON.stringify(game), { ex: TTL_SECONDS }),
    redis.lpush("tracker:game:index", game.gameId),
  ]);

  return NextResponse.json({ ok: true, gameId: game.gameId });
}
