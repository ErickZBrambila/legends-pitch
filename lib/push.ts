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
  if (!initVapid()) return 0;

  const redis = getRedis();
  if (!redis) return 0;

  const subs = await redis.hgetall<Record<string, string>>("push:subs");
  if (!subs) return 0;

  const payload = JSON.stringify({
    title: title.slice(0, 100),
    body: body.slice(0, 200),
    url,
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
  await redis.hset("push:subs", { [key]: JSON.stringify(subscription) });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const key = createHash("sha256").update(endpoint).digest("hex");
  await redis.hdel("push:subs", key);
}
