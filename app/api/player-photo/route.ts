import { NextRequest, NextResponse } from "next/server";
import { getParentSession } from "@/lib/parent-auth";
import { sanityWriteClient } from "@/lib/sanity/client";
import { rateLimit } from "@/lib/ratelimit";

export async function DELETE(req: NextRequest) {
  const limited = await rateLimit(req, "photo-submission");
  if (limited) return limited;

  const authed = await getParentSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) return NextResponse.json({ error: "Missing playerId" }, { status: 400 });

  await sanityWriteClient.patch(playerId).unset(["photo"]).commit();
  return NextResponse.json({ ok: true });
}
