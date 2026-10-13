import type { Announcement } from "@/lib/types";

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

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-amber-500 text-xl mt-0.5" aria-hidden>📣</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
            {announcement.author} · {date}
          </p>
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">{message}</p>
        </div>
      </div>
    </div>
  );
}
