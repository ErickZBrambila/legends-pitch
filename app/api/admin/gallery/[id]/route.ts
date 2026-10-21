import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { sanityWriteClient } from "@/lib/sanity/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await getAdminSession();
  if (!authed) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { images } = (await req.json()) as { images: Array<{ assetId: string; alt: string }> };

  if (!images?.length) {
    return Response.json({ error: "At least one image is required" }, { status: 400 });
  }

  await sanityWriteClient
    .patch(id)
    .append("images", images.map((img) => ({
      _key: Math.random().toString(36).slice(2, 10),
      image: { _type: "image", asset: { _type: "reference", _ref: img.assetId } },
      alt: img.alt ?? "",
    })))
    .commit();

  return Response.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await getAdminSession();
  if (!authed) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await sanityWriteClient.delete(id);
  return Response.json({ ok: true });
}
