import { NextResponse } from "next/server";
import { getFamilySession } from "@/lib/family-auth";

export async function GET() {
  const authed = await getFamilySession();
  if (!authed) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true });
}
