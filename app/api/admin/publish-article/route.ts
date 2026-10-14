import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { sanityWriteClient, sanityClient } from "@/lib/sanity/client";
import { broadcastPush } from "@/lib/push";

export async function POST(req: NextRequest) {
  const authed = await getAdminSession();
  if (!authed) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { postId } = await req.json() as { postId?: string };
  if (!postId) return Response.json({ error: "postId is required" }, { status: 400 });

  await sanityWriteClient.patch(postId).set({ status: "published" }).commit();

  // Fire-and-forget push — fetch title+slug for a useful notification
  sanityClient
    .fetch<{ title: string; slug: string } | null>(
      `*[_id == $id][0]{ title, "slug": slug.current }`,
      { id: postId }
    )
    .then((article) => {
      const title = article?.title ?? "New article";
      const slug = article?.slug;
      return broadcastPush(
        `📰 ${title}`,
        "A new article was just published on the North Legends FC website.",
        slug ? `/news/${slug}` : "/news"
      );
    })
    .catch(() => {});

  return Response.json({ ok: true, postId });
}
