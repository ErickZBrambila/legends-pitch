import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { hashPasscode, FAMILY_COOKIE } from "@/lib/family-auth";
import { rateLimit } from "@/lib/ratelimit";

// Constant-time string comparison to avoid leaking length/content via timing.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    // Still run a comparison against a same-length buffer to keep timing flat.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "login");
  if (limited) return limited;

  let passcode: unknown;
  try {
    ({ passcode } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof passcode !== "string" || passcode.length === 0 || passcode.length > 200) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  const envVal = process.env.FAMILY_PASSCODE ?? "";
  if (!envVal || !safeEqual(passcode, envVal)) {
    // Do NOT leak lengths / whether the env var is set.
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  const token = hashPasscode(passcode);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(FAMILY_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
