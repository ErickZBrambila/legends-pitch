import { NextRequest, NextResponse } from "next/server";
import { hashPasscode, FAMILY_COOKIE } from "@/lib/family-auth";

export async function POST(req: NextRequest) {
  const { passcode } = await req.json();

  if (passcode !== process.env.FAMILY_PASSCODE) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  const token = hashPasscode(passcode);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(FAMILY_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
