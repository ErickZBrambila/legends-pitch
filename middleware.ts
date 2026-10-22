import { NextRequest, NextResponse } from "next/server";

// ── helpers ────────────────────────────────────────────────────────────────

async function sha256(value: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(value + salt);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64urlToUint8Array(s: string): Uint8Array {
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(pad);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

type AdminTokenPayload = { id: string; role: string; exp: number };

async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "dev-fallback-admin-secret-change-in-prod";
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = base64urlToUint8Array(sig);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes.buffer as ArrayBuffer,
      new TextEncoder().encode(payload)
    );
    if (!valid) return null;

    const decoded: AdminTokenPayload = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    if (Date.now() > decoded.exp) return null;

    // Revocation check via Upstash HTTP (fail-closed; skip for bootstrap account)
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (upstashUrl && upstashToken && decoded.id !== "bootstrap") {
      try {
        const r = await fetch(
          `${upstashUrl}/sismember/admins:revoked/${encodeURIComponent(decoded.id)}`,
          { headers: { Authorization: `Bearer ${upstashToken}` } }
        );
        const data = await r.json();
        if (data.result === 1) return null;
      } catch {
        return null;
      }
    }
    return decoded;
  } catch {
    return null;
  }
}

const MEDIA_UPLOADER_PATHS = ["/admin/media", "/admin/photos"];

// ── middleware ─────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (host === "legends-pitch.vercel.app") {
    const url = new URL(req.url);
    url.host = "www.northlegendsfc.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  const { pathname } = req.nextUrl;

  // Admin gate — all /admin/* sub-pages require valid HMAC session token
  if (pathname.startsWith("/admin/") && pathname !== "/admin") {
    const token = req.cookies.get("nlfc_admin")?.value;
    if (!token) return NextResponse.redirect(new URL("/admin", req.url));

    const parsed = await verifyAdminToken(token);
    if (!parsed) return NextResponse.redirect(new URL("/admin", req.url));

    // media_uploader role is restricted to media and photos pages
    if (parsed.role === "media_uploader" && !MEDIA_UPLOADER_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/admin/media", req.url));
    }

    const res = NextResponse.next();
    res.headers.set("x-pathname", pathname);
    res.headers.set("x-admin-role", parsed.role);
    return res;
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
    const res = NextResponse.next();
    res.headers.set("x-pathname", pathname);
    return res;
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
