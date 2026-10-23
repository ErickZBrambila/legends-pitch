import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getRedis } from "@/lib/redis";
import { getAccountByEmail } from "@/lib/parent-auth";
import { sendParentPasswordReset } from "@/lib/email";

const RESET_TTL = 60 * 60; // 1 hour

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const account = await getAccountByEmail(email.toLowerCase().trim());

  // Always respond OK — don't leak whether the email exists
  if (account) {
    const redis = getRedis();
    if (redis) {
      const token = randomBytes(32).toString("hex");
      await redis.set(`reset:parent:${token}`, account.id, { ex: RESET_TTL });
      await sendParentPasswordReset(account.email, token);
    }
  }

  return NextResponse.json({ ok: true });
}
