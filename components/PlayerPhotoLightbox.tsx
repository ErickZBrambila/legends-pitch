"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { Player } from "@/lib/types";

interface Props {
  player: Player;
  onClose: () => void;
  onChangePhoto: (player: Player) => void;
}

export default function PlayerPhotoLightbox({ player, onClose, onChangePhoto }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      <div
        className="relative flex flex-col items-center gap-5 max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white text-sm transition-colors z-10"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Photo or placeholder */}
        <div className="relative w-56 h-72 sm:w-64 sm:h-80 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#d4af37]">
          {player.photoUrl ? (
            <Image
              src={player.photoUrl}
              alt={player.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 224px, 256px"
            />
          ) : (
            <div className="w-full h-full bg-[var(--color-navy)] flex items-center justify-center">
              <span className="text-6xl font-black text-[#d4af37]">{player.number}</span>
            </div>
          )}
        </div>

        {/* Name + number */}
        <div className="text-center">
          <p className="text-white font-black text-xl tracking-tight">{player.name}</p>
          <p className="text-[#d4af37] font-bold text-sm mt-0.5">
            #{player.number} · {player.position}
          </p>
        </div>

        {/* Bio */}
        {player.bio && (
          <div className="w-full bg-white/10 rounded-xl px-4 py-3 text-center">
            <p className="text-white/90 text-sm leading-relaxed">{player.bio}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-2 w-full">
          <button
            onClick={() => { onClose(); onChangePhoto(player); }}
            className="text-xs text-white/50 hover:text-white/80 transition-colors border border-white/20 hover:border-white/40 px-4 py-1.5 rounded-full"
          >
            {player.photoUrl ? "Change photo · Edit bio" : "Add photo · Edit bio"}
          </button>
        </div>
      </div>
    </div>
  );
}
