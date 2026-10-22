import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

// Graceful degradation: if Upstash env vars aren't set, all requests pass through.
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel env to activate.
function makeRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function makeLimiter(redis: Redis, requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(requests, window), prefix: "nlfc" });
}

// Per-route limits
const LIMITS = {
  login:             { requests: 5,  window: "15 m" },  // 5 attempts per 15 min
  feedback:          { requests: 3,  window: "1 h"  },  // 3 submissions per hour
  download:          { requests: 60, window: "1 m"  },  // 60 downloads per minute (parents watching)
  save:              { requests: 20, window: "1 m"  },  // 20 clip saves per minute
  "photo-submission": { requests: 5,  window: "1 h"  },  // 5 photo uploads per hour per IP
  "player-bio":       { requests: 10, window: "1 h"  },  // 10 bio saves per hour per IP
  register:           { requests: 5,  window: "1 h"  },  // 5 registration attempts per hour per IP
} as const;

type LimitKey = keyof typeof LIMITS;

const redis = makeRedis();
const limiters = redis
  ? Object.fromEntries(
      Object.entries(LIMITS).map(([k, v]) => [k, makeLimiter(redis, v.requests, v.window)])
    ) as Record<LimitKey, Ratelimit>
  : null;

export function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Returns a 429 Response if the rate limit is exceeded, null if the request should proceed.
 * No-ops (returns null) if Upstash env vars are not configured.
 */
export async function rateLimit(
  req: NextRequest,
  key: LimitKey
): Promise<Response | null> {
  if (!limiters) return null; // not configured yet — pass through

  const ip = getIP(req);
  const { success, limit, remaining, reset } = await limiters[key].limit(ip);

  if (!success) {
    return new Response(JSON.stringify({ error: "Too many requests — try again later." }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(reset),
        "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
      },
    });
  }

  return null;
}
