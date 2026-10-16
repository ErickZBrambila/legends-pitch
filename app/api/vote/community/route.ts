import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { toggleCommunityVote, WISHLIST_SLUGS } from "@/lib/votes";

const DEVICE_COOKIE = "nlfc_device_id";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const slug = body?.slug;

  if (!WISHLIST_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  let deviceId = req.cookies.get(DEVICE_COOKIE)?.value;
  let isNew = false;
  if (!deviceId || !UUID_RE.test(deviceId)) {
    deviceId = randomUUID();
    isNew = true;
  }

  const result = await toggleCommunityVote(slug, deviceId);

  const res = NextResponse.json({ slug, communityCount: result.count, hasVoted: result.hasVoted });
  if (isNew) {
    res.cookies.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}
