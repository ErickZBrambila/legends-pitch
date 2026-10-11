import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import TeamTabs from "@/components/TeamTabs";
import { getGalleryEventsByTeam } from "@/lib/sanity/queries";
import type { TeamSlug } from "@/lib/sanity/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Gallery");
  return { title: t("metaTitle") };
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const team: TeamSlug = teamParam === "u12" ? "u12" : "u11";

  const t = await getTranslations("Gallery");
  const locale = await getLocale();

  const events = await getGalleryEventsByTeam(team);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h1 className="text-3xl font-black text-gray-900">{t("heading")}</h1>
          </div>
          <p className="text-gray-500 text-sm">{t("subtitle")}</p>
        </div>
        <TeamTabs activeTeam={team} />
      </div>

      {events.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-gray-400 text-lg font-medium">{t("noPhotos")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const cover = event.images[0] ?? null;
            const title = locale === "es" && event.title_es ? event.title_es : event.title;

            return (
              <Link
                key={event.id}
                href={`/gallery/${event.id}?team=${team}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-[var(--color-accent)]/40 transition-all"
              >
                {/* Cover image */}
                <div className="relative w-full bg-[var(--color-navy)] overflow-hidden" style={{ paddingBottom: "66.66%" }}>
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover.url}
                      alt={cover.alt || title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />

                  {/* Photo count badge */}
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t("photoCount", { count: event.images.length })}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="font-bold text-gray-900 text-base leading-snug">{title}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(event.date, locale)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
