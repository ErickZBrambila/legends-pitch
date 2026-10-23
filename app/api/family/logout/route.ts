import { NextResponse } from "next/server";
import { FAMILY_COOKIE } from "@/lib/family-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(FAMILY_COOKIE, "", { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
