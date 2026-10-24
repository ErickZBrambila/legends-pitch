import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import type { TrackerGame } from "@/lib/types";
import { familyAccessDenied } from "@/lib/family-access";
import { rateLimit } from "@/lib/ratelimit";

const TTL_SECONDS = 60 * 24 * 60 * 60; // 60 days

export async function POST(req: NextRequest) {
  const denied = await familyAccessDenied();
  if (denied) return denied;
  const limited = await rateLimit(req, "tracker");
  if (limited) return limited;

  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });

  // Cap payload size so the endpoint can't be used to fill Redis.
  const MAX_BYTES = 512 * 1024;
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let game: TrackerGame;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    game = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof game.gameId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(game.gameId) || !game.opponent || !["u11", "u12"].includes(game.teamAgeGroup)) {
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
