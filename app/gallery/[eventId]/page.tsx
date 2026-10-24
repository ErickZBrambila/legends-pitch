import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import GalleryLightbox from "@/components/GalleryLightbox";
import { getGalleryEventById } from "@/lib/sanity/queries";
import { requireFamilyAccess } from "@/lib/family-access";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getGalleryEventById(eventId);
  return { title: event?.title ?? "Album" };
}

export default async function GalleryEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ team?: string }>;
}) {
  // Server-side gate (don't rely on middleware alone for kids' media).
  await requireFamilyAccess("/gallery");

  const [{ eventId }, { team: teamParam }] = await Promise.all([params, searchParams]);
  const team = teamParam === "u12" ? "u12" : "u11";

  const [event, t, locale] = await Promise.all([
    getGalleryEventById(eventId),
    getTranslations("Gallery"),
    getLocale(),
  ]);

  if (!event) notFound();

  const title = locale === "es" && event.title_es ? event.title_es : event.title;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Back link */}
      <Link
        href={`/gallery?team=${team}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] font-medium hover:underline mb-8"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t("backToGallery")}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">{title}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date(event.date).toLocaleDateString(locale, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          {" · "}
          {t("photoCount", { count: event.images.length })}
        </p>
      </div>

      {event.images.length === 0 ? (
        <p className="text-gray-400 text-center py-20">{t("noPhotos")}</p>
      ) : (
        <GalleryLightbox images={event.images} />
      )}
    </div>
  );
}
