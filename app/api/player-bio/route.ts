import { NextRequest, NextResponse } from "next/server";
import { getParentSession } from "@/lib/parent-auth";
import { sanityClient, sanityWriteClient } from "@/lib/sanity/client";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "player-bio");
  if (limited) return limited;

  const authed = await getParentSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { playerId, bio } = body as { playerId?: unknown; bio?: unknown };

  if (typeof playerId !== "string" || !playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }
  if (typeof bio !== "string") {
    return NextResponse.json({ error: "Invalid bio" }, { status: 400 });
  }

  const trimmed = bio.trim().slice(0, 500);

  const player = await sanityClient.fetch<{ _id: string } | null>(
    `*[_type == "player" && _id == $id][0]{ _id }`,
    { id: playerId }
  );
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  if (trimmed) {
    await sanityWriteClient.patch(playerId).set({ bio: trimmed }).commit();
  } else {
    await sanityWriteClient.patch(playerId).unset(["bio"]).commit();
  }

  return NextResponse.json({ ok: true });
}
