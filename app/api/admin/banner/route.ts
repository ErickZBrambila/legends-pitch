import { NextRequest, NextResponse } from "next/server";
import { getNeoSession } from "@/lib/neo-auth";
import { getBanner, setBanner, clearBanner, type BannerType } from "@/lib/banner";
import { broadcastPush } from "@/lib/push";

const VALID_TYPES = new Set<BannerType>(["maintenance", "incident", "info"]);

export async function GET() {
  const banner = await getBanner();
  return NextResponse.json({ banner });
}

export async function POST(req: NextRequest) {
  const authed = await getNeoSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (body.clear) {
    await clearBanner();
    return NextResponse.json({ ok: true, cleared: true });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const type: BannerType = VALID_TYPES.has(body.type) ? body.type : "info";

  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  await setBanner(message, type);
  const sent = await broadcastPush(`📢 ${message}`, "Tap to view the site for details.", "/").catch(() => 0);
  return NextResponse.json({ ok: true, sent });
}
