import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { hashPassword } from "@/lib/parent-auth";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}));
  if (!token || !password || typeof token !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const accountId = await redis.get<string>(`reset:parent:${token}`);
  if (!accountId) {
    return NextResponse.json({ error: "Reset link is invalid or has expired" }, { status: 400 });
  }

  const raw = await redis.get<string>(`parent:account:${accountId}`);
  if (!raw) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const stored = JSON.parse(raw);
  stored.passwordHash = await hashPassword(password);
  await redis.set(`parent:account:${accountId}`, JSON.stringify(stored));
  await redis.del(`reset:parent:${token}`);

  return NextResponse.json({ ok: true });
}
