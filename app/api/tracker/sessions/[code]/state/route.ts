import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
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
