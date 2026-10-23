import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

const SESSION_TTL = 60 * 60 * 24 * 7;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });

  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const exists = await redis.exists(`tracker:session:${code}`);
  if (!exists) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  let events: unknown[];
  try {
    events = await req.json();
    if (!Array.isArray(events)) throw new Error();
  } catch {
    return NextResponse.json({ error: "Expected array of events" }, { status: 400 });
  }

  if (events.length === 0) return NextResponse.json({ ok: true });
  if (events.length > 200) return NextResponse.json({ error: "Too many events" }, { status: 400 });

  // Upsert each event by id — idempotent, dedup is free via hash key
  const hsetPayload: Record<string, string> = {};
  for (const ev of events) {
    const e = ev as Record<string, unknown>;
    if (!e.id || typeof e.id !== "string") continue;
    hsetPayload[e.id] = JSON.stringify(e);
  }

  if (Object.keys(hsetPayload).length > 0) {
    await Promise.all([
      redis.hset(`tracker:session:${code}:events`, hsetPayload),
      redis.expire(`tracker:session:${code}:events`, SESSION_TTL),
    ]);
  }

  return NextResponse.json({ ok: true, upserted: Object.keys(hsetPayload).length });
}
