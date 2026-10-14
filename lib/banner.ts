import { getRedis } from "@/lib/redis";

const KEY = "site:banner";

export type BannerType = "maintenance" | "incident" | "info";

export interface SiteBanner {
  message: string;
  type: BannerType;
  createdAt: string;
}

export async function getBanner(): Promise<SiteBanner | null> {
  const redis = getRedis();
  if (!redis) return null;
  return redis.get<SiteBanner>(KEY);
}

export async function setBanner(message: string, type: BannerType): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(KEY, { message, type, createdAt: new Date().toISOString() });
}

export async function clearBanner(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(KEY);
}
