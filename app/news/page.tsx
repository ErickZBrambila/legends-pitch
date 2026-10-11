import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import TeamTabs from "@/components/TeamTabs";
import { getPostsByTeam } from "@/lib/sanity/queries";
import type { TeamSlug } from "@/lib/sanity/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("News");
  return { title: t("metaTitle") };
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const team: TeamSlug = teamParam === "u12" ? "u12" : "u11";

  const t = await getTranslations("News");
  const locale = await getLocale();

  const posts = await getPostsByTeam(team);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black text-gray-900">{t("heading")}</h1>
        <TeamTabs activeTeam={team} />
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-400 text-center py-20">{t("noPosts")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/news/${post.slug}?team=${team}`}>
              <article className="bg-white border border-gray-100 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-green-200 transition-all">
                <p className="text-xs text-gray-400 mb-2">
                  {new Date(post.publishedAt).toLocaleDateString(locale, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  · {post.author}
                </p>
                <h2 className="text-lg md:text-xl font-bold text-gray-800 leading-snug mb-2">
                  {locale === "es" && post.title_es ? post.title_es : post.title}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                  {locale === "es" && post.excerpt_es ? post.excerpt_es : post.excerpt}
                </p>
                <span className="inline-block mt-3 text-sm font-semibold text-[var(--color-primary)]">
                  {t("readMore")}
                </span>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
