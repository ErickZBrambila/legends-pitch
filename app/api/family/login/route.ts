import { NextRequest, NextResponse } from "next/server";
import { hashPasscode, FAMILY_COOKIE } from "@/lib/family-auth";

export async function POST(req: NextRequest) {
  const { passcode } = await req.json();

  const envVal = process.env.FAMILY_PASSCODE ?? "";
  if (passcode !== envVal) {
    return NextResponse.json({
      error: "Incorrect passcode",
      debug: { receivedLen: passcode.length, envLen: envVal.length, envSet: envVal.length > 0 },
    }, { status: 401 });
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
