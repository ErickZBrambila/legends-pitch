"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types";
import RosterField from "./RosterField";
import PhotoSubmitModal from "./PhotoSubmitModal";
import PlayerPhotoLightbox from "./PlayerPhotoLightbox";

const POSITION_COLORS: Record<string, string> = {
  GK: "bg-yellow-100 text-yellow-800 border-yellow-200",
  DEF: "bg-blue-100 text-blue-800 border-blue-200",
  MID: "bg-green-100 text-green-800 border-green-200",
  FWD: "bg-red-100 text-red-800 border-red-200",
};

const POSITION_LABEL_KEYS: Record<string, string> = {
  GK: "goalkeepers",
  DEF: "defenders",
  MID: "midfielders",
  FWD: "forwards",
};

const POS_ORDER = ["GK", "DEF", "MID", "FWD"];

export default function RosterView({
  players,
  pendingPlayerIds = [],
}: {
  players: Player[];
  pendingPlayerIds?: string[];
}) {
  const t = useTranslations("Roster");
  const [view, setView] = useState<"field" | "list">("field");
  const [photoModal, setPhotoModal] = useState<Player | null>(null);
  const [lightboxPlayer, setLightboxPlayer] = useState<Player | null>(null);

  function handlePlayerClick(player: Player) {
    if (player.photoUrl || player.bio) {
      setLightboxPlayer(player);
    } else {
      setPhotoModal(player);
    }
  }

  const pendingSet = new Set(pendingPlayerIds);

  const byPosition = POS_ORDER.map((pos) => ({
    pos,
    group: players.filter((p) => p.position === pos).sort((a, b) => a.number - b.number),
  }));

  return (
    <>
      {/* View toggle */}
      <div className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1 w-fit">
        {(["field", "list"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === v
                ? "bg-[var(--color-accent)] text-[#1c1c1e] shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {v === "field" ? t("viewField") : t("viewList")}
          </button>
        ))}
      </div>

      {view === "field" ? (
        <div className="flex flex-col items-center">
          <RosterField players={players} onPlayerClick={handlePlayerClick} />
          <p className="text-xs text-gray-400 mt-4 text-center">
            {t("playersSeason", { count: players.length })}
          </p>
          <p className="text-xs text-gray-400 mt-1 text-center">
            📷 Tap a player to view or add their photo
          </p>
        </div>
      ) : (
        <div>
          {byPosition.map(({ pos, group }) => {
            if (group.length === 0) return null;
            return (
              <section key={pos} className="mb-10">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">
                  {t(POSITION_LABEL_KEYS[pos])}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {group.map((player) => {
                    const hasPending = pendingSet.has(player.id);
                    return (
                      <div
                        key={player.id}
                        onClick={() => handlePlayerClick(player)}
                        className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all cursor-pointer"
                      >
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--color-navy)] flex items-center justify-center mb-3 flex-shrink-0">
                          {player.photoUrl ? (
                            <Image
                              src={player.photoUrl}
                              alt={player.name}
                              width={56}
                              height={56}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <span className="text-xl font-black text-[var(--color-accent-light)]">
                              {player.number}
                            </span>
                          )}
                        </div>

                        <p className="font-bold text-gray-800 text-sm">{player.name}</p>
                        <span
                          className={`mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${POSITION_COLORS[pos]}`}
                        >
                          {pos}
                        </span>

                        {/* Photo button — visible for all players */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setPhotoModal(player); }}
                          className={`mt-2.5 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${
                            hasPending
                              ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                              : player.photoUrl
                              ? "bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100 hover:text-gray-600"
                              : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-700"
                          }`}
                        >
                          <span>📷</span>
                          <span>
                            {hasPending ? "Pending review" : player.photoUrl ? "Change photo" : "Add photo"}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {lightboxPlayer && (
        <PlayerPhotoLightbox
          player={lightboxPlayer}
          onClose={() => setLightboxPlayer(null)}
          onChangePhoto={(p) => { setLightboxPlayer(null); setPhotoModal(p); }}
        />
      )}

      {photoModal && (
        <PhotoSubmitModal
          player={photoModal}
          onClose={() => setPhotoModal(null)}
        />
      )}
    </>
  );
}
