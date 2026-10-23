import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Redis } from "@upstash/redis";
import { sendAdminPasswordReset } from "@/lib/email";

const RESET_TTL = 60 * 60; // 1 hour

function makeRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const redis = makeRedis();
  if (redis) {
    const normalizedEmail = email.toLowerCase().trim();
    const accountId = await redis.get<string>(`admin:email:${normalizedEmail}`);

    if (accountId) {
      const token = randomBytes(32).toString("hex");
      await redis.set(`reset:admin:${token}`, accountId, { ex: RESET_TTL });
      await sendAdminPasswordReset(normalizedEmail, token);
    }
  }

  // Always respond OK — don't leak whether the email exists
  return NextResponse.json({ ok: true });
}
