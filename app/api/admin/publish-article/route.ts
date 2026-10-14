import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { sanityWriteClient } from "@/lib/sanity/client";

export async function POST(req: NextRequest) {
  const authed = await getAdminSession();
  if (!authed) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { postId } = await req.json() as { postId?: string };
  if (!postId) return Response.json({ error: "postId is required" }, { status: 400 });

  await sanityWriteClient.patch(postId).set({ status: "published" }).commit();

  return Response.json({ ok: true, postId });
}
