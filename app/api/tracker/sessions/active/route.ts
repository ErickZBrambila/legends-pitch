import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { familyAccessDenied } from "@/lib/family-access";

// DELETE — primary tagger calls this when ending the game
export async function DELETE() {
  const denied = await familyAccessDenied();
  if (denied) return denied;

  const redis = getRedis();
  if (!redis) return NextResponse.json({ ok: true });
  await redis.del("tracker:active");
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const denied = await familyAccessDenied();
  if (denied) return denied;

  const redis = getRedis();
  if (!redis) return NextResponse.json({ session: null });

  const code = await redis.get<string>("tracker:active");
  if (!code) return NextResponse.json({ session: null });

  const session = await redis.hgetall(`tracker:session:${code}`);
  if (!session || Object.keys(session).length === 0) {
    await redis.del("tracker:active");
    return NextResponse.json({ session: null });
  }

  return NextResponse.json({ session: { ...session, code } });
}
