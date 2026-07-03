import { highlightVideos } from "@/lib/data";
import type { HighlightVideo } from "@/lib/types";

export const metadata = {
  title: "Highlights | North Legends FC",
  description: "360° match highlights and clinic videos from North Legends FC.",
};

function groupByEvent(videos: HighlightVideo[]): Record<string, HighlightVideo[]> {
  return videos.reduce<Record<string, HighlightVideo[]>>((acc, v) => {
    (acc[v.event] ??= []).push(v);
    return acc;
  }, {});
}

export default function HighlightsPage() {
  const grouped = groupByEvent(highlightVideos);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 mb-1">Highlights</h1>
        <p className="text-gray-500 text-sm">
          360° videos — click any clip to watch and drag on YouTube
        </p>
      </div>

      {Object.entries(grouped).map(([event, videos]) => (
        <section key={event} className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full bg-[var(--color-accent)]" />
            <h2 className="text-xl font-black text-gray-800">{event}</h2>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {videos.length} clips
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((v) => (
              <a
                key={v.id}
                href={`https://youtu.be/${v.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-[var(--color-accent)]/30 transition-all"
              >
                {/* Thumbnail */}
                <div className="relative w-full overflow-hidden bg-gray-900" style={{ paddingBottom: "56.25%" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`}
                    alt={v.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
                      <svg className="w-6 h-6 text-[var(--color-primary)] ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* 360 badge */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-black px-2 py-0.5 rounded-full tracking-wider">
                    360°
                  </div>
                </div>

                {/* Info */}
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{v.title}</p>
                  <p className="text-xs text-[var(--color-primary)] mt-1 font-medium group-hover:underline">
                    Watch on YouTube →
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
