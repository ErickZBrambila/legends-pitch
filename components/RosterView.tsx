"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types";
import RosterField from "./RosterField";

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

export default function RosterView({ players }: { players: Player[] }) {
  const t = useTranslations("Roster");
  const [view, setView] = useState<"field" | "list">("field");

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
          <RosterField players={players} />
          <p className="text-xs text-gray-400 mt-4 text-center">
            {t("playersSeason", { count: players.length })}
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
                  {group.map((player) => (
                    <div
                      key={player.id}
                      className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all"
                    >
                      <div className="w-14 h-14 rounded-full bg-[var(--color-navy)] flex items-center justify-center mb-3">
                        <span className="text-xl font-black text-[var(--color-accent-light)]">
                          {player.number}
                        </span>
                      </div>
                      <p className="font-bold text-gray-800 text-sm">{player.name}</p>
                      <span
                        className={`mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${POSITION_COLORS[pos]}`}
                      >
                        {pos}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
