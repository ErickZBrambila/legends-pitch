import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getNeoSession } from "@/lib/neo-auth";
import { getRedis } from "@/lib/redis";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  const authed = await getNeoSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { title, message, url } = (body ?? {}) as Record<string, unknown>;
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "Redis not configured" }, { status: 503 });

  const subs = await redis.hgetall<Record<string, string>>("push:subs");
  if (!subs) return NextResponse.json({ ok: true, sent: 0 });

  const payload = JSON.stringify({
    title: String(title).slice(0, 100),
    body: typeof message === "string" ? message.slice(0, 200) : "",
    url: typeof url === "string" ? url : "/",
  });

  const staleKeys: string[] = [];
  let sent = 0;

  await Promise.allSettled(
    Object.entries(subs).map(async ([key, raw]) => {
      let sub: webpush.PushSubscription;
      try {
        sub = JSON.parse(raw) as webpush.PushSubscription;
      } catch {
        staleKeys.push(key);
        return;
      }
      try {
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          staleKeys.push(key);
        }
      }
    })
  );

  if (staleKeys.length > 0) {
    await redis.hdel("push:subs", ...staleKeys);
  }

  return NextResponse.json({ ok: true, sent });
}
