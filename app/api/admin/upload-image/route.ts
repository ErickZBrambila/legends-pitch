import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { sanityWriteClient } from "@/lib/sanity/client";

export async function POST(req: NextRequest) {
  const authed = await getAdminSession();
  if (!authed) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return Response.json({ error: "No image provided" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: "Only JPEG, PNG, WebP, or GIF images are allowed" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Image must be under 10 MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const asset = await sanityWriteClient.assets.upload("image", buffer, {
    filename: file.name,
    contentType: file.type,
  });

  return Response.json({ assetId: asset._id, url: asset.url });
}
