import { getRedis } from "@/lib/redis";
import { createHash } from "crypto";

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function trackPageView(path: string, ip: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const date = today();
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

export interface AnalyticsData {
  daily: DailyStats[];
  topPages: Array<{ path: string; views: number }>;
  pushSubscribers: number;
  totalPageviews: number;
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const redis = getRedis();
  if (!redis) {
    return { daily: [], topPages: [], pushSubscribers: 0, totalPageviews: 0 };
  }

  // Build last 14 days
  const dates: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const [topPagesRaw, pushSubsRaw, ...dailyResults] = await Promise.all([
    redis.zrange<string[]>("analytics:pages", 0, 9, { rev: true, withScores: true }),
    redis.hlen("push:subs"),
    ...dates.map(async (date) => {
      const [daily, uniq] = await Promise.all([
        redis.hgetall<Record<string, number>>(`analytics:daily:${date}`),
        redis.pfcount(`analytics:uniq:${date}`),
      ]);
      const pageviews = daily
        ? Object.values(daily).reduce((s, v) => s + Number(v), 0)
        : 0;
      return { date, pageviews, uniques: uniq ?? 0 };
    }),
  ]);

  // zrange with withScores returns [member, score, member, score, ...]
  const topPages: Array<{ path: string; views: number }> = [];
  if (Array.isArray(topPagesRaw)) {
    for (let i = 0; i < topPagesRaw.length; i += 2) {
      topPages.push({ path: String(topPagesRaw[i]), views: Number(topPagesRaw[i + 1]) });
    }
  }

  const daily = dailyResults as DailyStats[];
  const totalPageviews = topPages.reduce((s, p) => s + p.views, 0);

  return {
    daily,
    topPages,
    pushSubscribers: pushSubsRaw ?? 0,
    totalPageviews,
  };
}
