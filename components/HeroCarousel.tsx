"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

const SLIDES = [
  { type: "video" as const, duration: 15000 },
  { type: "photo" as const, src: "/team-photo-2026.jpg", alt: "North Legends FC 2026 — Never Give Up", duration: 8000 },
  { type: "photo" as const, src: "/team-photo.jpg",     alt: "North Legends FC team",                  duration: 8000 },
  { type: "photo" as const, src: "/sponsors-banner.jpg", alt: "North Legends FC — Empowered by Houk Air Conditioning and Bonilla's Painting LLC", duration: 8000 },
] as const;

const FADE = 1000;

export default function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const goTo = useCallback((next: number) => {
    setIdx(next);
  }, []);

  useEffect(() => {
    const current = SLIDES[idx];
    timerRef.current = setTimeout(() => {
      goTo((idx + 1) % SLIDES.length);
    }, current.duration);
    return () => clearTimeout(timerRef.current);
  }, [idx, goTo]);

  return (
    <>
      {/* Video layer */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out"
        style={{ transitionDuration: `${FADE}ms`, opacity: idx === 0 ? 1 : 0 }}
      >
        <source src="/Legends_hero_video.mp4" type="video/mp4" />
      </video>

      {/* Photo layers */}
      {SLIDES.filter((s) => s.type === "photo").map((slide, i) => {
        const slideIdx = i + 1; // video is 0
        return (
          <div
            key={slide.src}
            className="absolute inset-0 transition-opacity ease-in-out"
            style={{ transitionDuration: `${FADE}ms`, opacity: idx === slideIdx ? 1 : 0 }}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover object-center"
              priority={slideIdx === 1}
              sizes="100vw"
            />
          </div>
        );
      })}

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => { clearTimeout(timerRef.current); goTo(i); }}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === i ? "bg-[var(--color-accent)] w-5" : "bg-white/50 w-2"
            }`}
          />
        ))}
      </div>
    </>
  );
}
