import { NextResponse } from "next/server";
import { PARENT_COOKIE } from "@/lib/parent-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PARENT_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
