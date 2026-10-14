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

  const subs = await redis.hgetall<Record<string, { endpoint?: string; keys?: unknown; expirationTime?: unknown }>>("push:subs");

  const subDetails = subs
    ? Object.entries(subs).map(([key, sub]) => ({
        key,
        endpointHost: sub?.endpoint ? new URL(sub.endpoint).hostname : "missing",
        endpointPrefix: sub?.endpoint ? sub.endpoint.slice(0, 60) : "missing",
        hasKeys: !!(sub?.keys),
        expirationTime: sub?.expirationTime ?? null,
      }))
    : [];

  return NextResponse.json({
    vapidOk,
    redis: true,
    subCount: subDetails.length,
    subs: subDetails,
  });
}
