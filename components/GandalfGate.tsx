"use client";

import Link from "next/link";
import { useEffect } from "react";

// ── 8-bit Gandalf pixel art ─────────────────────────────────────────────────
// 16 cols × 22 rows, pixel size 9px → 144 × 198px
const PX = 9;
const COLORS: Record<string, string> = {
  g: "#888",    // hat (mid grey)
  G: "#555",    // hat brim / band
  f: "#ffcc88", // face
  e: "#1a0a00", // eyes
  w: "#f5f0e8", // beard
  R: "#5c5c7a", // robe
  b: "#7b4a1e", // staff
  y: "#ffd700", // staff glow
};

const GRID = [
  "......gg........",
  ".....gggg.......",
  "....gggggg......",
  "...gggggggg.....",
  "..gggggggggg....",
  "..GGGGGGGGGG....",
  "...ffffffff.....",
  "...f.e..e.f.....",
  "...ffffffff.....",
  "...fwwwwwwwf....",
  "..Rfwwwwwwwfgg..",
  ".bRRwwwwwwwRRR..",
  "..bRRwwwwwwRRR..",
  "...bRRwwwwRRRR..",
  "....bRRwwRRRRR..",
  ".....bRRRRRRR...",
  "......bRRRRR....",
  ".......bRRR.....",
  "........bR......",
  ".........b......",
  ".........b......",
  ".........y......",
];

function GandalfSprite() {
  const rects: React.ReactElement[] = [];
  GRID.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === "." || !COLORS[ch]) continue;
      rects.push(
        <rect key={`${x}-${y}`} x={x * PX} y={y * PX} width={PX} height={PX} fill={COLORS[ch]} />
      );
    }
  });
  return (
    <svg
      width={16 * PX}
      height={22 * PX}
      viewBox={`0 0 ${16 * PX} ${22 * PX}`}
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    >
      {rects}
    </svg>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  /** Where the user was trying to go — used to build the ?next= redirect */
  returnPath?: string;
}

export default function GandalfGate({ onClose, returnPath }: Props) {
  // Close on Escape
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
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-xs w-full text-center overflow-hidden">
        {/* Pixelated header bar */}
        <div className="bg-[var(--color-navy)] px-4 pt-5 pb-2 flex flex-col items-center gap-3">
          <GandalfSprite />
          <p
            id="gandalf-title"
            className="text-white font-black uppercase tracking-widest text-lg leading-tight"
            style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.1em" }}
          >
            YOU SHALL<br />NOT PASS!
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
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
