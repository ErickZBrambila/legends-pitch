import type { Metadata } from "next";
import Image from "next/image";
import TeamTabs from "@/components/TeamTabs";
import { getGalleryEventsByTeam } from "@/lib/sanity/queries";
import type { TeamSlug } from "@/lib/sanity/queries";

export const metadata: Metadata = { title: "Gallery" };

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const team: TeamSlug = teamParam === "u12" ? "u12" : "u11";

  const events = await getGalleryEventsByTeam(team);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black text-gray-900">Photo Gallery</h1>
        <TeamTabs activeTeam={team} />
      </div>

      {events.length === 0 ? (
        <p className="text-gray-400 text-center py-20">No photos yet — add them in the Studio.</p>
      ) : (
        events.map((event) => (
          <section key={event.id} className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{event.title}</h2>
              <span className="text-xs text-gray-400">
                {new Date(event.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {event.images.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-video overflow-hidden rounded-xl bg-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
