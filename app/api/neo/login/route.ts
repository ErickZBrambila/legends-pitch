import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { hashNeoPassword, NEO_COOKIE } from "@/lib/neo-auth";
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

  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const expected = process.env.THE_ONE ?? "";
  if (
    typeof password !== "string" ||
    password.length === 0 ||
    password.length > 200 ||
    !expected ||
    !safeEqual(password, expected)
  ) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = hashNeoPassword(password);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(NEO_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
