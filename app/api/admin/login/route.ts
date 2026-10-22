import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { verifyAdminPassword, createAdminSession, hasAnyAdminAccount, ADMIN_COOKIE, type AdminAccount } from "@/lib/admin-accounts";
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

function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
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
    typeof password !== "string" ||
    password.length === 0 ||
    password.length > 200
  ) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Try individual account auth first
  if (typeof email === "string" && email.length > 0) {
    const account = await verifyAdminPassword(email, password);
    if (account) {
      const token = createAdminSession(account);
      const res = NextResponse.json({ ok: true, role: account.role });
      setSessionCookie(res, token);
      return res;
    }
  }

  // Fallback: ADMIN_PASSWORD env var — only when no accounts exist yet (bootstrap mode)
  const bootstrapMode = !(await hasAnyAdminAccount());
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  if (bootstrapMode && adminPassword && safeEqual(password, adminPassword)) {
    // Synthetic bootstrap account — full admin, not stored in Redis
    const bootstrapAccount: AdminAccount = {
      id: "bootstrap",
      email: "admin",
      displayName: "Admin",
      role: "admin",
      approved: true,
      createdAt: new Date().toISOString(),
    };
    const token = createAdminSession(bootstrapAccount);
    const res = NextResponse.json({ ok: true, role: "admin", bootstrap: true });
    setSessionCookie(res, token);
    return res;
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
