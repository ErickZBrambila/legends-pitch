import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getRedis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  let subscription: unknown;
  try {
    subscription = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (
    typeof subscription !== "object" ||
    subscription === null ||
    !("endpoint" in subscription) ||
    typeof (subscription as Record<string, unknown>).endpoint !== "string"
  ) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const redis = getRedis();
  if (!redis) {
    // No Redis configured — silently accept so the client doesn't error
    return NextResponse.json({ ok: true });
  }

  const endpoint = (subscription as { endpoint: string }).endpoint;
  const key = createHash("sha256").update(endpoint).digest("hex");

  await redis.hset("push:subs", { [key]: JSON.stringify(subscription) });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const endpoint =
    typeof body === "object" && body !== null && "endpoint" in body
      ? (body as { endpoint: string }).endpoint
      : null;

  if (!endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 });

  const redis = getRedis();
  if (redis) {
    const key = createHash("sha256").update(endpoint).digest("hex");
    await redis.hdel("push:subs", key);
  }

  return NextResponse.json({ ok: true });
}
