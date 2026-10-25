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

  let accountId: string;
  try {
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const colon = decoded.lastIndexOf(":");
    if (colon === -1) return false;
    const expiry = parseInt(decoded.slice(colon + 1), 10);
    if (isNaN(expiry) || Date.now() > expiry) return false;
    accountId = decoded.slice(0, colon);
  } catch {
    return false;
  }

  // Check revocation blocklist via Upstash HTTP — works in Edge runtime.
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    try {
      const r = await fetch(
        `${redisUrl}/sismember/parents:revoked/${encodeURIComponent(accountId)}`,
        { headers: { Authorization: `Bearer ${redisToken}` } },
      );
      const json = await r.json() as { result: number };
      if (json.result === 1) return false;
    } catch {
      return false; // deny on fetch error — fail closed
    }
  }

  return true;
}
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
  // Register, forgot, and reset are public-facing pages for new coaches.
  const adminPublic = ["/admin/register", "/admin/forgot", "/admin/reset"];
  if (pathname.startsWith("/admin/") && pathname !== "/admin" && !adminPublic.some((p) => pathname.startsWith(p))) {
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

  // /family is a legacy entry point — redirect to parent login
  if (pathname === "/family" || pathname.startsWith("/family/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/parent/login";
    // preserve any ?next= param so old bookmarks still land correctly
    const next = req.nextUrl.searchParams.get("next");
    if (next) url.searchParams.set("next", next);
    return NextResponse.redirect(url, 308);
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
