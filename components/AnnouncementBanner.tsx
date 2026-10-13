import type { Announcement } from "@/lib/types";
import GameWeather from "@/components/GameWeather";

interface Props {
  announcement: Announcement;
  locale: string;
}

export default function AnnouncementBanner({ announcement, locale }: Props) {
  const message =
    locale === "es" && announcement.message_es
      ? announcement.message_es
      : announcement.message;

  const date = new Date(announcement.publishedAt).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  });

  const hasWeather =
    announcement.locationLat != null &&
    announcement.locationLng != null &&
    announcement.eventTime != null;

  const mapsUrl = announcement.location
    ? `https://maps.google.com/?q=${encodeURIComponent(announcement.location)}`
    : null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-amber-500 text-xl mt-0.5" aria-hidden>📣</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
            {announcement.author} · {date}
          </p>
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">{message}</p>

          {(mapsUrl || hasWeather) && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium hover:underline"
                >
                  📍 {announcement.location}
                </a>
              )}
              {hasWeather && (
                <GameWeather
                  lat={announcement.locationLat!}
                  lng={announcement.locationLng!}
                  gameIso={announcement.eventTime!}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
