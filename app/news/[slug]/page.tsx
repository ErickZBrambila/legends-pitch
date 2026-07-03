import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { newsPosts, getPostBySlug } from "@/lib/data";

export async function generateStaticParams() {
  return newsPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return { title: post?.title ?? "Post not found" };
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const paragraphs = post.body.split("\n\n").filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link
        href="/news"
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
          {paragraphs.map((para, i) => {
            if (para.startsWith("- ")) {
              const items = para
                .split("\n")
                .filter((l) => l.startsWith("- "))
                .map((l) => l.slice(2));
              return (
                <ul key={i} className="list-disc list-inside space-y-1 my-3">
                  {items.map((item, j) => (
                    <li key={j} dangerouslySetInnerHTML={{ __html: boldMarkdown(item) }} />
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="mb-4" dangerouslySetInnerHTML={{ __html: boldMarkdown(para) }} />
            );
          })}
        </div>
      </article>
    </div>
  );
}

function boldMarkdown(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
