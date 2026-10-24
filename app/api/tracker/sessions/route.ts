import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { familyAccessDenied } from "@/lib/family-access";
import { rateLimit } from "@/lib/ratelimit";

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

function makeCode(): string {
  // 4-char alphanumeric, unambiguous (no 0/O, 1/I/L)
  const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: NextRequest) {
  const denied = await familyAccessDenied();
  if (denied) return denied;
  const limited = await rateLimit(req, "tracker");
  if (limited) return limited;

  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { matchId, opponent, teamAgeGroup, homeAway, date, taggerId, taggerName } = body;
  if (!opponent || !teamAgeGroup || !taggerId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Generate a unique code (retry on collision, extremely unlikely)
  let code = makeCode();
  for (let i = 0; i < 5; i++) {
    const exists = await redis.exists(`tracker:session:${code}`);
    if (!exists) break;
    code = makeCode();
  }

  const session = {
    code,
    matchId: matchId || "",
    opponent,
    teamAgeGroup,
    homeAway: homeAway || "home",
    date: date || new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
    primaryTaggerId: taggerId,
  };

  await Promise.all([
    redis.hset(`tracker:session:${code}`, session),
    redis.expire(`tracker:session:${code}`, SESSION_TTL),
    // Register primary tagger
    redis.hset(`tracker:session:${code}:taggers`, {
      [taggerId]: JSON.stringify({ taggerId, name: taggerName || "Primary", isPrimary: true }),
    }),
    redis.expire(`tracker:session:${code}:taggers`, SESSION_TTL),
    // Publish as the active session so joiners can discover it without a code
    redis.set("tracker:active", code, { ex: SESSION_TTL }),
  ]);

  return NextResponse.json({ code, session });
}
