import { NextRequest, NextResponse } from "next/server";

// ── helpers ────────────────────────────────────────────────────────────────

async function sha256(value: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(value + salt);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── middleware ─────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin gate — /admin/dashboard requires ADMIN_PASSWORD cookie
  if (pathname.startsWith("/admin/dashboard")) {
    const token = req.cookies.get("nlfc_admin")?.value;
    const expected = await sha256(process.env.ADMIN_PASSWORD ?? "", "-nlfc-admin-2026");
    if (token !== expected) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // Family gate — /videos and /gallery require FAMILY_PASSCODE cookie
  const familyProtected = ["/videos", "/gallery", "/highlights"];
  if (familyProtected.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get("nlfc_family")?.value;
    const expected = await sha256(process.env.FAMILY_PASSCODE ?? "", "-nlfc-family-2026");
    if (token !== expected) {
      const url = req.nextUrl.clone();
      url.pathname = "/family";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/videos/:path*", "/gallery/:path*", "/highlights/:path*"],
};
