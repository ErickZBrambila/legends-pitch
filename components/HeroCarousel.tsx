"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const VIDEO_DURATION = 15000; // ms to show video
const PHOTO_DURATION = 8000;  // ms to show photo
const FADE_DURATION  = 1000;  // CSS transition duration

export default function HeroCarousel() {
  const [showPhoto, setShowPhoto] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const scheduleNext = (isPhoto: boolean) => {
      timer = setTimeout(() => {
        setShowPhoto(!isPhoto);
        scheduleNext(!isPhoto);
      }, isPhoto ? PHOTO_DURATION : VIDEO_DURATION);
    };

    scheduleNext(false); // start on video
    return () => clearTimeout(timer);
  }, []);

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
        style={{ transitionDuration: `${FADE_DURATION}ms`, opacity: showPhoto ? 0 : 1 }}
      >
        <source src="/Legends_hero_video.mp4" type="video/mp4" />
      </video>

      {/* Photo layer */}
      <div
        className="absolute inset-0 transition-opacity ease-in-out"
        style={{ transitionDuration: `${FADE_DURATION}ms`, opacity: showPhoto ? 1 : 0 }}
      >
        <Image
          src="/team-photo.jpg"
          alt="North Legends FC team"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
      </div>

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        <button
          aria-label="Show video"
          onClick={() => setShowPhoto(false)}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${!showPhoto ? "bg-[var(--color-accent)] w-5" : "bg-white/50"}`}
        />
        <button
          aria-label="Show team photo"
          onClick={() => setShowPhoto(true)}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${showPhoto ? "bg-[var(--color-accent)] w-5" : "bg-white/50"}`}
        />
      </div>
    </>
  );
}
