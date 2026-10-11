import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "next-sanity";
import { getLocale, getTranslations } from "next-intl/server";
import { getPostBySlug } from "@/lib/sanity/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (post?.title) return { title: post.title };
  const t = await getTranslations("NewsPost");
  return { title: t("metaTitleNotFound") };
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

  const t = await getTranslations("NewsPost");
  const locale = await getLocale();

  const backTeam = team === "u12" ? "u12" : "u11";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link
        href={`/news?team=${backTeam}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] font-medium hover:underline mb-6"
      >
        {t("backToNews")}
      </Link>

      <article>
        <header className="mb-6">
          <p className="text-xs text-gray-400 mb-2">
            {new Date(post.publishedAt).toLocaleDateString(locale, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            · {post.author}
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
            {locale === "es" && post.title_es ? post.title_es : post.title}
          </h1>
        </header>

        <div className="prose prose-sm md:prose max-w-none text-gray-700 leading-relaxed">
          {(() => {
            const activeBody = locale === "es" && post.body_es && post.body_es.length > 0 ? post.body_es : post.body;
            return activeBody && (activeBody as unknown[]).length > 0 ? (
              <PortableText value={activeBody as Parameters<typeof PortableText>[0]["value"]} />
            ) : (
              <p className="text-gray-400">{t("noContent")}</p>
            );
          })()}
        </div>
      </article>
    </div>
  );
}
