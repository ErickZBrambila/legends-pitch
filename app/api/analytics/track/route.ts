import { NextRequest, NextResponse } from "next/server";
import { trackPageView } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  const { path } = (await req.json().catch(() => ({}))) as { path?: string };
  if (!path || typeof path !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Normalize: strip query strings, limit length
  const normalized = path.split("?")[0].slice(0, 128) || "/";

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  await trackPageView(normalized, ip);
  return NextResponse.json({ ok: true });
}
