import { NextRequest, NextResponse } from "next/server";
import { createAccount, generateSessionToken, PARENT_COOKIE } from "@/lib/parent-auth";
import { FAMILY_COOKIE, isValidFamilyToken } from "@/lib/family-auth";
import { rateLimit } from "@/lib/ratelimit";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "register");
  if (limited) return limited;

  if (!isValidFamilyToken(req.cookies.get(FAMILY_COOKIE)?.value)) {
    return NextResponse.json({ error: "Team PIN required" }, { status: 403 });
  }

  let email: unknown, password: unknown, displayName: unknown;
  try {
    ({ email, password, displayName } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof displayName !== "string"
  ) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (!email || !password || !displayName) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (email.length > 200 || password.length > 200 || displayName.length > 200) {
    return NextResponse.json({ error: "Fields exceed maximum length" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const result = await createAccount({ email, password, displayName });

  if ("error" in result) {
    const status = result.error === "Service unavailable" ? 503 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  const token = generateSessionToken(result.account.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PARENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
