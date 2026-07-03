import type { Metadata } from "next";
import Link from "next/link";
import { newsPosts } from "@/lib/data";

export const metadata: Metadata = { title: "News" };

export default function NewsPage() {
  const sorted = [...newsPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-900 mb-8">
        News & Announcements
      </h1>

      <div className="flex flex-col gap-4">
        {sorted.map((post) => (
          <Link key={post.id} href={`/news/${post.slug}`}>
            <article className="bg-white border border-gray-100 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-green-200 transition-all">
              <p className="text-xs text-gray-400 mb-2">
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · {post.author}
              </p>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 leading-snug mb-2">
                {post.title}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
              <span className="inline-block mt-3 text-sm font-semibold text-[var(--color-primary)]">
                Read more →
              </span>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
