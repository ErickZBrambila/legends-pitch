import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { sanityClient, sanityWriteClient } from "@/lib/sanity/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await getAdminSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const doc = await sanityClient.fetch<{
    _id: string;
    status: string;
    player: { _ref: string };
    image: { asset: { _ref: string } };
  } | null>(
    `*[_type == "playerPhotoSubmission" && _id == $id][0]{
      _id, status, player, image
    }`,
    { id },
    { cache: "no-store" }
  );

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.status !== "pending") return NextResponse.json({ error: "Already reviewed" }, { status: 400 });

  // Patch the player document with the submitted photo
  await sanityWriteClient.patch(doc.player._ref).set({ photo: doc.image }).commit();

  // Mark submission as approved
  await sanityWriteClient.patch(id).set({ status: "approved" }).commit();

  return NextResponse.json({ ok: true });
}
