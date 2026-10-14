import webpush from "web-push";
import { getRedis } from "@/lib/redis";
import { createHash } from "crypto";

function initVapid() {
  const subject = process.env.VAPID_SUBJECT;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  return true;
}

export async function broadcastPush(
  title: string,
  body: string,
  url = "/"
): Promise<number> {
  if (!initVapid()) {
    console.error("[push] VAPID init failed — check VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY");
    return 0;
  }

  const redis = getRedis();
  if (!redis) {
    console.error("[push] Redis not configured — check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN");
    return 0;
  }

  // @upstash/redis auto-parses JSON on reads, so values come back as objects
  const subs = await redis.hgetall<Record<string, webpush.PushSubscription>>("push:subs");
  if (!subs) return 0;

  const payload = JSON.stringify({
    title: title.slice(0, 100),
    body: body.slice(0, 200),
    url,
  });

  const staleKeys: string[] = [];
  let sent = 0;

  await Promise.allSettled(
    Object.entries(subs).map(async ([key, sub]) => {
      if (!sub?.endpoint) { staleKeys.push(key); return; }
      try {
        await webpush.sendNotification(sub, payload, {
          TTL: 86400,       // keep for 24h if device is offline
          urgency: "normal",
        });
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        console.error("[push] sendNotification failed:", status, (err as Error).message);
        if (status === 404 || status === 410) staleKeys.push(key);
      }
    })
  );

  if (staleKeys.length > 0) {
    await redis.hdel("push:subs", ...staleKeys);
  }

  return sent;
}

export async function saveSubscription(subscription: webpush.PushSubscription): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const key = createHash("sha256").update(subscription.endpoint).digest("hex");
  await redis.hset("push:subs", { [key]: subscription });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const key = createHash("sha256").update(endpoint).digest("hex");
  await redis.hdel("push:subs", key);
}
