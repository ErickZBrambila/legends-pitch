"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  photos: string[];
  heading: string;
}

export default function ChampionshipPhotoCarousel({ photos, heading }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevPhoto = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null)),
    [photos.length]);
  const nextPhoto = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null)),
    [photos.length]);

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

  return (
    <>
      <h2
        className="campeones-shimmer leading-none mb-6"
        style={{
          fontFamily: "var(--font-anton), sans-serif",
          fontSize: "clamp(2.5rem, 10vw, 5rem)",
        }}
      >
        {heading}
      </h2>

      {/* Carousel with side arrows */}
      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-opacity"
            style={{
              background: "rgba(10,15,40,0.85)",
              border: "1px solid rgba(212,175,55,0.35)",
              color: "#d4af37",
            }}
          >
            ‹
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-opacity"
            style={{
              background: "rgba(10,15,40,0.85)",
              border: "1px solid rgba(212,175,55,0.35)",
              color: "#d4af37",
            }}
          >
            ›
          </button>
        )}

        {/* Scrollable strip */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        >
          {photos.map((src, i) => (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              className="shrink-0 snap-start rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-[var(--color-accent)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              style={{ width: 180 }}
              aria-label={`View photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/championship/${src}`}
                alt={`Championship photo ${i + 1}`}
                className="w-full h-auto block"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            aria-label="Close"
            className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl leading-none z-10"
          >
            ×
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-2xl z-10"
            style={{ background: "rgba(255,255,255,0.1)", color: "#d4af37" }}
          >
            ‹
          </button>

          {/* Image */}
          <div
            className="relative max-w-[90vw] max-h-[88vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/championship/${photos[lightboxIndex]}`}
              alt={`Championship photo ${lightboxIndex + 1}`}
              className="max-w-[90vw] max-h-[88vh] w-auto h-auto rounded-xl object-contain"
            />
            <p className="absolute bottom-3 left-0 right-0 text-center text-white/40 text-xs tabular-nums">
              {lightboxIndex + 1} / {photos.length}
            </p>
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
            aria-label="Next photo"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-2xl z-10"
            style={{ background: "rgba(255,255,255,0.1)", color: "#d4af37" }}
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
