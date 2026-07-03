import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "nlfc_admin";

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password + "-nlfc-admin-2026");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin/dashboard")) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const expected = await hashPassword(process.env.ADMIN_PASSWORD ?? "");

  if (token !== expected) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
