import { getRedis } from "@/lib/redis";

export const WISHLIST_SLUGS = [
  "player-stats",
  "attendance-tracking",
  "season-awards",
] as const;

export type WishlistSlug = (typeof WISHLIST_SLUGS)[number];

function communityKey(slug: string) {
  return `vote:community:${slug}`;
}
function coachKey(slug: string) {
  return `vote:coach:${slug}`;
}
function difficultyKey(slug: string) {
  return `vote:difficulty:${slug}`;
}

export type Difficulty = "Easy" | "Medium" | "Hard" | null;

export interface VoteData {
  slug: string;
  communityCount: number;
  coachVoted: boolean;
  difficulty: Difficulty;
}

export async function getAllVotes(): Promise<VoteData[]> {
  const redis = getRedis();
  if (!redis) return WISHLIST_SLUGS.map((slug) => ({ slug, communityCount: 0, coachVoted: false, difficulty: null }));

  const results = await Promise.all(
    WISHLIST_SLUGS.map(async (slug) => {
      const [count, coach, diff] = await Promise.all([
        redis.get<number>(communityKey(slug)),
        redis.get<boolean>(coachKey(slug)),
        redis.get<Difficulty>(difficultyKey(slug)),
      ]);
      return {
        slug,
        communityCount: count ?? 0,
        coachVoted: coach ?? false,
        difficulty: diff ?? null,
      };
    })
  );
  return results;
}

export async function toggleCommunityVote(
  slug: string,
  deviceId: string
): Promise<{ count: number; hasVoted: boolean }> {
  const redis = getRedis();
  if (!redis) return { count: 0, hasVoted: false };

  const countKey = communityKey(slug);
  const votersKey = `vote:community:voters:${slug}`;

  const alreadyVoted = await redis.sismember(votersKey, deviceId);
  if (alreadyVoted) {
    await redis.srem(votersKey, deviceId);
    const count = await redis.decr(countKey);
    return { count: Math.max(0, count), hasVoted: false };
  } else {
    await redis.sadd(votersKey, deviceId);
    const count = await redis.incr(countKey);
    return { count, hasVoted: true };
  }
}

export async function toggleCoachVote(slug: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  const key = coachKey(slug);
  const current = await redis.get<boolean>(key);
  const next = !current;
  await redis.set(key, next);
  return next;
}

export async function setDifficulty(slug: string, difficulty: Difficulty): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  if (difficulty === null) {
    await redis.del(difficultyKey(slug));
  } else {
    await redis.set(difficultyKey(slug), difficulty);
  }
}
