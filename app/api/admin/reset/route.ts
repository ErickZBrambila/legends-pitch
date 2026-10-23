import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { resetAdminPassword } from "@/lib/admin-accounts";

function makeRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}));
  if (!token || !password || typeof token !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const redis = makeRedis();
  if (!redis) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const accountId = await redis.get<string>(`reset:admin:${token}`);
  if (!accountId) {
    return NextResponse.json({ error: "Reset link is invalid or has expired" }, { status: 400 });
  }

  const ok = await resetAdminPassword(accountId, password);
  if (!ok) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  await redis.del(`reset:admin:${token}`);
  return NextResponse.json({ ok: true });
}
