"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const CDN = "https://pub-ec6efd6486724c999de33694e15dd4dc.r2.dev";

type MediaItem =
  | { type: "video"; src: string }
  | { type: "photo"; src: string };

const MEDIA: MediaItem[] = [
  { type: "video", src: `${CDN}/championship/u12/celebration-main.mov` },
  { type: "photo", src: "/championship/u12/u12-champ-1.jpg" },
  { type: "photo", src: "/championship/u12/u12-champ-2.jpg" },
  { type: "photo", src: "/championship/u12/u12-champ-3.jpg" },
  { type: "photo", src: "/championship/u12/u12-champ-4.jpg" },
  { type: "photo", src: "/championship/u12/u12-champ-5.jpg" },
  { type: "video", src: `${CDN}/championship/u12/celebration.mov` },
];

const PHOTOS = MEDIA.filter((m): m is { type: "photo"; src: string } => m.type === "photo");

interface Props {
  heading: string;
}

export default function U12MediaCarousel({ heading }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null); // index into PHOTOS
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    return () => el.removeEventListener("scroll", updateArrows);
  }, [updateArrows]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevPhoto = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + PHOTOS.length) % PHOTOS.length : null)),
    []);
  const nextPhoto = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % PHOTOS.length : null)),
    []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, closeLightbox, prevPhoto, nextPhoto]);

  let photoIdx = -1;

  return (
    <>
      <h2
        className="campeones-shimmer leading-none mb-6"
        style={{ fontFamily: "var(--font-anton), sans-serif", fontSize: "clamp(2.5rem, 10vw, 5rem)" }}
      >
        {heading}
      </h2>

      <div className="relative">
        {canScrollLeft && (
          <button onClick={() => scroll("left")} aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(10,15,40,0.85)", border: "1px solid rgba(212,175,55,0.35)", color: "#d4af37" }}>
            ‹
          </button>
        )}
        {canScrollRight && (
          <button onClick={() => scroll("right")} aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(10,15,40,0.85)", border: "1px solid rgba(212,175,55,0.35)", color: "#d4af37" }}>
            ›
          </button>
        )}

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {MEDIA.map((item, i) => {
            if (item.type === "photo") {
              photoIdx++;
              const pIdx = photoIdx;
              return (
                <button key={i} onClick={() => setLightboxIndex(pIdx)}
                  className="shrink-0 snap-start rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-[var(--color-accent)] transition-all"
                  style={{ width: 180 }} aria-label={`View photo ${pIdx + 1}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.src} alt="" className="w-full h-auto block" loading="lazy" />
                </button>
              );
            }

            // Video item
            return (
              <div key={i} className="shrink-0 snap-start rounded-xl overflow-hidden ring-1 ring-white/10"
                style={{ width: 220, aspectRatio: "9/16", background: "#000", position: "relative" }}>
                {playingVideo === item.src ? (
                  /* eslint-disable-next-line jsx-a11y/media-has-caption */
                  <video src={item.src} autoPlay controls playsInline
                    className="absolute inset-0 w-full h-full object-contain"
                    onClick={(e) => e.stopPropagation()} />
                ) : (
                  <button onClick={() => setPlayingVideo(item.src)}
                    className="absolute inset-0 w-full h-full flex items-center justify-center group"
                    aria-label="Play video">
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video src={item.src} muted playsInline preload="metadata"
                      className="absolute inset-0 w-full h-full object-cover opacity-70" />
                    <div className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ background: "rgba(212,175,55,0.9)" }}>
                      <span className="text-[#1c1c1e] text-2xl ml-1">▶</span>
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)" }} onClick={closeLightbox}>
          <button onClick={closeLightbox} aria-label="Close"
            className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl leading-none z-10">×</button>
          <button onClick={(e) => { e.stopPropagation(); prevPhoto(); }} aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-2xl z-10"
            style={{ background: "rgba(255,255,255,0.1)", color: "#d4af37" }}>‹</button>
          <button onClick={(e) => { e.stopPropagation(); nextPhoto(); }} aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-2xl z-10"
            style={{ background: "rgba(255,255,255,0.1)", color: "#d4af37" }}>›</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PHOTOS[lightboxIndex].src} alt="" onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl" />
        </div>
      )}
    </>
  );
}
