export const metadata = {
  title: "Highlights | North Legends FC",
  description: "360° match highlights and clinic videos from North Legends FC.",
};

const VIDEOS = [
  { id: "5p_cSNI9Rew", title: "Summer Clinic 2026 — Clip 1" },
  { id: "w3ACv8vYUaQ", title: "Summer Clinic 2026 — Clip 2" },
  { id: "E5a0H_U-5e8", title: "Summer Clinic 2026 — Clip 3" },
  { id: "wFdGVF05nkc", title: "Summer Clinic 2026 — Clip 4" },
  { id: "cj6WDclqmvw", title: "Summer Clinic 2026 — Clip 5" },
  { id: "yZuEUVsQ3lE", title: "Summer Clinic 2026 — Clip 6" },
  { id: "roE2bWokuio", title: "Summer Clinic 2026 — Clip 7" },
  { id: "3nchbDT_gbo", title: "Summer Clinic 2026 — Clip 8" },
];

export default function HighlightsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-1">Highlights</h1>
        <p className="text-gray-500 text-sm">
          360° videos from Summer Clinic 2026 · Drag inside the video to look around
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {VIDEOS.map((v) => (
          <div key={v.id} className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${v.id}`}
                title={v.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-gray-800">{v.title}</p>
              <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-navy)]">
                360° Video
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
