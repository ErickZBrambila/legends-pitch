import { NextRequest, NextResponse } from "next/server";
import { generateMagicToken, hashPasscode, FAMILY_COOKIE, COOKIE_MAX_AGE } from "@/lib/family-auth";

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t");
  const expected = generateMagicToken();

  if (!t || t !== expected) {
    return NextResponse.redirect(new URL("/family", req.url));
  }

  const token = hashPasscode(process.env.FAMILY_PASSCODE ?? "");
  const res = NextResponse.redirect(new URL("/videos", req.url));
  res.cookies.set(FAMILY_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}
