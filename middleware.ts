import { NextRequest, NextResponse } from "next/server";

// ── helpers ────────────────────────────────────────────────────────────────

async function sha256(value: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(value + salt);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Verifies a parent session token (payload.sig — base64url HMAC-SHA256).
// Uses Web Crypto only — safe for the Edge runtime.
async function verifyParentToken(token: string): Promise<boolean> {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const sigB64url = token.slice(dot + 1);

  const secret = process.env.PARENT_SESSION_SECRET ?? "dev-parent-secret-2026-nlfc";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  let sigBytes: Uint8Array;
  try {
    sigBytes = Uint8Array.from(
      atob(sigB64url.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    );
  } catch {
    return false;
  }

  const valid = await crypto.subtle.verify("HMAC", key, sigBytes.buffer as ArrayBuffer, new TextEncoder().encode(payload));
  if (!valid) return false;

  try {
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const colon = decoded.lastIndexOf(":");
    if (colon === -1) return false;
    const expiry = parseInt(decoded.slice(colon + 1), 10);
    return !isNaN(expiry) && Date.now() <= expiry;
  } catch {
    return false;
  }
}

// ── middleware ─────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin gate — all /admin/* sub-pages require ADMIN_PASSWORD cookie
  if (pathname.startsWith("/admin/") && pathname !== "/admin") {
    const token = req.cookies.get("nlfc_admin")?.value;
    const expected = await sha256(process.env.ADMIN_PASSWORD ?? "", "-nlfc-admin-2026");
    if (token !== expected) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    const res = NextResponse.next();
    res.headers.set("x-pathname", pathname);
    return res;
  }

  // Family gate — /videos, /gallery, /highlights require EITHER:
  //   (a) valid family passcode cookie, OR
  //   (b) valid parent account session token
  const familyProtected = ["/videos", "/gallery", "/highlights"];
  if (familyProtected.some((p) => pathname.startsWith(p))) {
    const familyToken = req.cookies.get("nlfc_family")?.value;
    const expectedFamily = await sha256(process.env.FAMILY_PASSCODE ?? "", "-nlfc-family-2026");
    if (familyToken === expectedFamily) {
      const res = NextResponse.next();
      res.headers.set("x-pathname", pathname);
      return res;
    }

    const parentToken = req.cookies.get("nlfc_parent")?.value;
    if (parentToken && (await verifyParentToken(parentToken))) {
      const res = NextResponse.next();
      res.headers.set("x-pathname", pathname);
      return res;
    }

    const url = req.nextUrl.clone();
    url.pathname = "/family";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
