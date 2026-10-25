import { NextRequest, NextResponse } from "next/server";
import { getParentSession } from "@/lib/parent-auth";
import { sanityClient, sanityWriteClient } from "@/lib/sanity/client";
import { rateLimit } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) return NextResponse.json({ submission: null });

  const raw = await sanityClient.fetch<{ _id: string; submittedAt: string } | null>(
    `*[_type == "playerPhotoSubmission" && player._ref == $playerId && status == "pending"][0]{
      _id, submittedAt
    }`,
    { playerId },
    { cache: "no-store" }
  );

  return NextResponse.json({ submission: raw ? { id: raw._id, submittedAt: raw.submittedAt } : null });
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "photo-submission");
  if (limited) return limited;

  const authed = await getParentSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const playerId = formData.get("playerId");
  const file = formData.get("photo");

  if (typeof playerId !== "string" || !playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid photo" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Photo must be under 5 MB" }, { status: 400 });
  }

  // Verify player exists
  const player = await sanityClient.fetch<{ _id: string } | null>(
    `*[_type == "player" && _id == $id][0]{ _id }`,
    { id: playerId }
  );
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  // Upload image to Sanity assets
  const buffer = Buffer.from(await file.arrayBuffer());
  const asset = await sanityWriteClient.assets.upload("image", buffer, {
    filename: file.name,
    contentType: file.type,
  });

  // Delete any existing pending submission for this player
  const existing = await sanityClient.fetch<{ _id: string } | null>(
    `*[_type == "playerPhotoSubmission" && player._ref == $playerId && status == "pending"][0]{ _id }`,
    { playerId },
    { cache: "no-store" }
  );
  if (existing) await sanityWriteClient.delete(existing._id);

  // Create submission doc
  const doc = await sanityWriteClient.create({
    _type: "playerPhotoSubmission",
    player: { _type: "reference", _ref: playerId },
    image: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
    status: "pending",
    submittedAt: new Date().toISOString(),
  });

  return NextResponse.json({ id: doc._id });
}
