import { getRedis } from "@/lib/redis";
import { createHash } from "crypto";

const TZ = "America/Chicago";

function localDateStr(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays) d.setDate(d.getDate() - offsetDays);
  return d.toLocaleDateString("en-CA", { timeZone: TZ }); // en-CA gives YYYY-MM-DD
}

export async function trackPageView(path: string, ip: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const date = localDateStr();
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);

  await Promise.all([
    redis.zincrby("analytics:pages", 1, path),
    redis.hincrby(`analytics:daily:${date}`, path, 1),
    redis.pfadd(`analytics:uniq:${date}`, ipHash),
    redis.expire(`analytics:daily:${date}`, 60 * 60 * 24 * 90), // 90 day TTL
    redis.expire(`analytics:uniq:${date}`, 60 * 60 * 24 * 90),
  ]);
}

export interface DailyStats {
  date: string;
  pageviews: number;
  uniques: number;
}

export interface PushSubscriberBreakdown {
  total: number;
  ios: number;
  android: number;
  other: number;
}

export interface AnalyticsData {
  daily: DailyStats[];
  topPages: Array<{ path: string; views: number }>;
  pushSubscribers: PushSubscriberBreakdown;
  totalPageviews: number;
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const redis = getRedis();
  if (!redis) {
    return { daily: [], topPages: [], pushSubscribers: { total: 0, ios: 0, android: 0, other: 0 }, totalPageviews: 0 };
  }

  // Build last 14 days in local (Central) time
  const dates: string[] = [];
  for (let i = 13; i >= 0; i--) {
    dates.push(localDateStr(i));
  }

  const [topPagesRaw, pushSubsRaw, dailyResults] = await Promise.all([
    redis.zrange<string[]>("analytics:pages", 0, 9, { rev: true, withScores: true }),
    redis.hgetall<Record<string, { endpoint: string }>>("push:subs"),
    Promise.all(dates.map(async (date) => {
      const [daily, uniq] = await Promise.all([
        redis.hgetall<Record<string, number>>(`analytics:daily:${date}`),
        redis.pfcount(`analytics:uniq:${date}`),
      ]);
      const pageviews = daily
        ? Object.values(daily).reduce((s, v) => s + Number(v), 0)
        : 0;
      return { date, pageviews, uniques: uniq ?? 0 };
    })),
  ]);

  // zrange with withScores returns [member, score, member, score, ...]
  const topPages: Array<{ path: string; views: number }> = [];
  if (Array.isArray(topPagesRaw)) {
    for (let i = 0; i < topPagesRaw.length; i += 2) {
      topPages.push({ path: String(topPagesRaw[i]), views: Number(topPagesRaw[i + 1]) });
    }
  }

  const daily = dailyResults;
  const totalPageviews = topPages.reduce((s, p) => s + p.views, 0);

  const pushBreakdown: PushSubscriberBreakdown = { total: 0, ios: 0, android: 0, other: 0 };
  if (pushSubsRaw) {
    for (const sub of Object.values(pushSubsRaw)) {
      const endpoint = sub?.endpoint ?? "";
      pushBreakdown.total++;
      if (endpoint.includes("web.push.apple.com")) pushBreakdown.ios++;
      else if (endpoint.includes("fcm.googleapis.com")) pushBreakdown.android++;
      else pushBreakdown.other++;
    }
  }

  return {
    daily,
    topPages,
    pushSubscribers: pushBreakdown,
    totalPageviews,
  };
}
