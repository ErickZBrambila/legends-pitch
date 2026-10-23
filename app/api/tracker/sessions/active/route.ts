import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export async function GET() {
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
