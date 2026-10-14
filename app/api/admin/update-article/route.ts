import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { sanityWriteClient } from "@/lib/sanity/client";

export async function PATCH(req: NextRequest) {
  const authed = await getAdminSession();
  if (!authed) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, title, title_es, excerpt, excerpt_es, body_en, body_es } = await req.json() as {
    postId: string;
    title?: string;
    title_es?: string;
    excerpt?: string;
    excerpt_es?: string;
    body_en?: string;
    body_es?: string;
  };

  if (!postId) return Response.json({ error: "postId is required" }, { status: 400 });

  function textToBlocks(text: string) {
    return text.split(/\n\n+/).filter(Boolean).map((para) => ({
      _type: "block",
      _key: Math.random().toString(36).slice(2, 10),
      style: "normal",
      children: [{ _type: "span", _key: Math.random().toString(36).slice(2, 10), text: para.trim(), marks: [] }],
      markDefs: [],
    }));
  }

  const patch: Record<string, unknown> = {};
  if (title !== undefined) patch.title = title;
  if (title_es !== undefined) patch.title_es = title_es;
  if (excerpt !== undefined) patch.excerpt = excerpt;
  if (excerpt_es !== undefined) patch.excerpt_es = excerpt_es;
  if (body_en !== undefined) patch.body = textToBlocks(body_en);
  if (body_es !== undefined) patch.body_es = textToBlocks(body_es);

  await sanityWriteClient.patch(postId).set(patch).commit();

  return Response.json({ ok: true });
}
