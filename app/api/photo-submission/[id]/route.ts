import { NextRequest, NextResponse } from "next/server";
import { getParentSession } from "@/lib/parent-auth";
import { sanityClient, sanityWriteClient } from "@/lib/sanity/client";
import { rateLimit } from "@/lib/ratelimit";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(req, "photo-submission");
  if (limited) return limited;

  const authed = await getParentSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const doc = await sanityClient.fetch<{ _id: string; status: string } | null>(
    `*[_type == "playerPhotoSubmission" && _id == $id][0]{ _id, status }`,
    { id },
    { cache: "no-store" }
  );

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.status !== "pending") {
    return NextResponse.json({ error: "Cannot delete a reviewed submission" }, { status: 400 });
  }

  await sanityWriteClient.delete(id);
  return NextResponse.json({ ok: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(req, "photo-submission");
  if (limited) return limited;

  const authed = await getParentSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid photo" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Photo must be under 5 MB" }, { status: 400 });
  }

  const doc = await sanityClient.fetch<{ _id: string; status: string } | null>(
    `*[_type == "playerPhotoSubmission" && _id == $id][0]{ _id, status }`,
    { id },
    { cache: "no-store" }
  );
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.status !== "pending") {
    return NextResponse.json({ error: "Cannot update a reviewed submission" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const asset = await sanityWriteClient.assets.upload("image", buffer, {
    filename: file.name,
    contentType: file.type,
  });

  await sanityWriteClient.patch(id).set({
    image: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
    submittedAt: new Date().toISOString(),
  }).commit();

  return NextResponse.json({ ok: true });
}
