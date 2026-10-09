import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "next-sanity";
import { getPostBySlug } from "@/lib/sanity/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return { title: post?.title ?? "Post not found" };
}

export default async function NewsPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ team?: string }>;
}) {
  const [{ slug }, { team }] = await Promise.all([params, searchParams]);
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const backTeam = team === "u12" ? "u12" : "u11";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link
        href={`/news?team=${backTeam}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] font-medium hover:underline mb-6"
      >
        ← Back to News
      </Link>

      <article>
        <header className="mb-6">
          <p className="text-xs text-gray-400 mb-2">
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            · {post.author}
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
            {post.title}
          </h1>
        </header>

        <div className="prose prose-sm md:prose max-w-none text-gray-700 leading-relaxed">
          {post.body && post.body.length > 0 ? (
            <PortableText value={post.body as Parameters<typeof PortableText>[0]["value"]} />
          ) : (
            <p className="text-gray-400">No content yet.</p>
          )}
        </div>
      </article>
    </div>
  );
}
