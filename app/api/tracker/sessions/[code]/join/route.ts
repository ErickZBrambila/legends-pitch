import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { familyAccessDenied } from "@/lib/family-access";

const SESSION_TTL = 60 * 60 * 24 * 7;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const denied = await familyAccessDenied();
  if (denied) return denied;

  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });

  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const session = await redis.hgetall(`tracker:session:${code}`);
  if (!session || Object.keys(session).length === 0) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { taggerId, taggerName } = body;
  if (!taggerId) return NextResponse.json({ error: "taggerId required" }, { status: 400 });

  const isPrimary = session.primaryTaggerId === taggerId;

  // Register tagger (idempotent)
  await Promise.all([
    redis.hset(`tracker:session:${code}:taggers`, {
      [taggerId]: JSON.stringify({ taggerId, name: taggerName || "Tagger", isPrimary }),
    }),
    redis.expire(`tracker:session:${code}:taggers`, SESSION_TTL),
  ]);

  // Return current event snapshot so late joiners catch up instantly
  const rawEvents = await redis.hgetall(`tracker:session:${code}:events`);
  const events = rawEvents
    ? Object.values(rawEvents).map((v) => (typeof v === "string" ? JSON.parse(v) : v))
    : [];

  const rawTaggers = await redis.hgetall(`tracker:session:${code}:taggers`);
  const taggers = rawTaggers
    ? Object.values(rawTaggers).map((v) => (typeof v === "string" ? JSON.parse(v) : v))
    : [];

  return NextResponse.json({
    session,
    isPrimary,
    events,
    taggers,
    serverTime: new Date().toISOString(),
  });
}
