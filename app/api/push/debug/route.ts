import { NextResponse } from "next/server";
import { getNeoSession } from "@/lib/neo-auth";
import { getRedis } from "@/lib/redis";

export async function GET() {
  const authed = await getNeoSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vapidOk = !!(
    process.env.VAPID_SUBJECT &&
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY
  );

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ vapidOk, redis: false, subs: null });
  }

  const subs = await redis.hgetall("push:subs");
  return NextResponse.json({
    vapidOk,
    redis: true,
    subCount: subs ? Object.keys(subs).length : 0,
    subKeys: subs ? Object.keys(subs) : [],
  });
}
