"use client";

import Link from "next/link";
import { useEffect } from "react";

const C = "#2d1a0e"; // dark brown silhouette, matches the reference image

function GandalfSprite() {
  return (
    <svg
      viewBox="0 0 210 205"
      width="170"
      height="166"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {/* Pointed hat */}
      <path d="M 105,2 L 60,62 L 150,62 Z" fill={C} />
      {/* Hat brim — wider ellipse at base of hat */}
      <ellipse cx="105" cy="66" rx="56" ry="11" fill={C} />
      {/* Head */}
      <ellipse cx="105" cy="83" rx="20" ry="18" fill={C} />
      {/* Body / robes — narrow at shoulders, flares dramatically to bottom */}
      <path d="M 82,97 Q 105,88 128,97 L 162,196 L 46,196 Z" fill={C} />
      {/* Left arm — from left shoulder reaching upper-left to hand */}
      <polygon points="82,97  82,107  18,78  18,68" fill={C} />
      {/* Sword blade — from left hand angled diagonally up-right toward center */}
      <polygon points="18,68  14,75  76,12  80,7" fill={C} />
      {/* Right arm — from right shoulder extending to the right */}
      <polygon points="128,97  128,107  172,85  172,75" fill={C} />
      {/* Staff — tall, from right hand sweeping down to lower-right */}
      <polygon points="170,75  175,75  196,200  191,202" fill={C} />
    </svg>
  );
}

interface Props {
  onClose: () => void;
  returnPath?: string;
}

export default function GandalfGate({ onClose, returnPath }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const next = returnPath ? `?next=${encodeURIComponent(returnPath)}` : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gandalf-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-sm w-full text-center overflow-hidden">

        {/* Hero section — cream background + silhouette, matching reference image */}
        <div className="bg-[#f5f1eb] px-4 pt-5 pb-3 flex flex-col items-center">
          <p
            className="font-black uppercase leading-none tracking-tight mb-2"
            style={{ fontSize: "1.75rem", color: C, fontFamily: "Impact, 'Arial Black', sans-serif" }}
          >
            YOU SHALL
          </p>
          <GandalfSprite />
          <p
            id="gandalf-title"
            className="font-black uppercase leading-none tracking-tight mt-2"
            style={{ fontSize: "1.75rem", color: C, fontFamily: "Impact, 'Arial Black', sans-serif" }}
          >
            NOT PASS!
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-700 text-sm font-medium leading-relaxed mb-1">
            Video downloads are exclusive to{" "}
            <span className="text-[var(--color-primary)] font-bold">NLFC parent accounts</span>.
          </p>
          <p className="text-gray-400 text-xs mb-5">
            Create your free account and get instant access to download any clip or reel.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/parent/register${next}`}
              className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-black text-sm hover:brightness-110 transition"
              onClick={onClose}
            >
              Create Free Account →
            </Link>
            <Link
              href={`/parent/login${next}`}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
              onClick={onClose}
            >
              Already have one? Sign in
            </Link>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/10 text-gray-500 hover:bg-black/15 hover:text-gray-700 transition text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
