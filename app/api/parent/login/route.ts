import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import {
  getAccountByEmail,
  verifyPassword,
  generateSessionToken,
  PARENT_COOKIE,
  type ParentAccount,
} from "@/lib/parent-auth";
import { rateLimit } from "@/lib/ratelimit";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "login");
  if (limited) return limited;

  let email: unknown, password: unknown;
  try {
    ({ email, password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password ||
    email.length > 200 ||
    password.length > 200
  ) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const stored = await getAccountByEmail(email);

  // Always run verifyPassword to prevent timing attacks
  const dummyHash = "0000000000000000000000000000000000000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  const passwordOk = stored
    ? await verifyPassword(stored.passwordHash, password)
    : await verifyPassword(dummyHash, password).then(() => false);

  if (!stored || !passwordOk) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!stored.approved) {
    return NextResponse.json({ error: "Account pending approval" }, { status: 403 });
  }

  const { passwordHash: _ph, ...account } = stored;
  void _ph;

  const token = generateSessionToken(stored.id);
  const res = NextResponse.json({ ok: true, account: account as ParentAccount });
  res.cookies.set(PARENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
