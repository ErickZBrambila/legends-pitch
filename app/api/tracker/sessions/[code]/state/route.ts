import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { familyAccessDenied } from "@/lib/family-access";

const SESSION_TTL = 60 * 60 * 24 * 7;

// PATCH — primary tagger calls this when kicking off to store kickoffAt
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const denied = await familyAccessDenied();
  if (denied) return denied;

  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });

  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const exists = await redis.exists(`tracker:session:${code}`);
  if (!exists) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const updates: Record<string, string> = {};
  if (body.kickoffAt) updates.kickoffAt = body.kickoffAt;
  if (Object.keys(updates).length > 0) {
    await Promise.all([
      redis.hset(`tracker:session:${code}`, updates),
      redis.expire(`tracker:session:${code}`, SESSION_TTL),
    ]);
  }

  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: NextRequest,
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

  const [rawEvents, rawTaggers] = await Promise.all([
    redis.hgetall(`tracker:session:${code}:events`),
    redis.hgetall(`tracker:session:${code}:taggers`),
  ]);

  const events = rawEvents
    ? Object.values(rawEvents).map((v) => (typeof v === "string" ? JSON.parse(v) : v))
    : [];

  const taggers = rawTaggers
    ? Object.values(rawTaggers).map((v) => (typeof v === "string" ? JSON.parse(v) : v))
    : [];

  return NextResponse.json({ session, events, taggers, serverTime: new Date().toISOString() });
}
