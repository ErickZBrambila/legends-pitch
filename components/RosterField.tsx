import Image from "next/image";
import type { Player } from "@/lib/types";

function PlayerToken({ player, onClick }: { player: Player; onClick?: (p: Player) => void }) {
  const avatar = player.photoUrl ? (
    // Portrait oval — 20% bigger than original circle, 3:4 width-to-height ratio
    <div
      className="relative rounded-full border-2 border-[#d4af37] overflow-hidden shadow-lg"
      style={{ width: "clamp(43px, 12%, 62px)", aspectRatio: "3/4" }}
    >
      <Image
        src={player.photoUrl}
        alt={player.name}
        fill
        className="object-cover"
        sizes="62px"
      />
      {onClick && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/25 transition-colors" />
      )}
    </div>
  ) : (
    // Original circle with number inside
    <div
      className="relative rounded-full bg-[#1c1c1e] border-2 border-[#d4af37] flex items-center justify-center shadow-lg"
      style={{ width: "clamp(36px, 10%, 52px)", height: "clamp(36px, 10%, 52px)" }}
    >
      <span className="font-black text-[#d4af37]" style={{ fontSize: "clamp(11px, 2.5vw, 16px)" }}>
        {player.number}
      </span>
      {onClick && (
        <div className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center">
          <span className="opacity-0 hover:opacity-100 text-white" style={{ fontSize: "clamp(8px, 2vw, 12px)" }}>📷</span>
        </div>
      )}
    </div>
  );

  const inner = player.photoUrl ? (
    // Photo token: oval → #number → name
    <div className="flex flex-col items-center gap-1" style={{ width: "clamp(50px, 14%, 72px)" }}>
      {avatar}
      <span className="font-black text-[#d4af37]" style={{ fontSize: "clamp(9px, 2vw, 13px)" }}>
        #{player.number}
      </span>
      <span
        className="text-white font-bold text-center leading-tight drop-shadow"
        style={{ fontSize: "clamp(8px, 1.8vw, 11px)" }}
      >
        {player.name}
      </span>
    </div>
  ) : (
    // No-photo token: circle-with-number → name (original 2-row layout)
    <div className="flex flex-col items-center gap-1" style={{ width: "clamp(44px, 13%, 64px)" }}>
      {avatar}
      <span
        className="text-white font-bold text-center leading-tight drop-shadow"
        style={{ fontSize: "clamp(8px, 1.8vw, 11px)" }}
      >
        {player.name}
      </span>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(player)}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded-2xl"
        aria-label={player.photoUrl ? `View photo for ${player.name}` : `Add photo for ${player.name}`}
      >
        {inner}
      </button>
    );
  }

  return inner;
}

export default function RosterField({
  players,
  onPlayerClick,
}: {
  players: Player[];
  onPlayerClick?: (player: Player) => void;
}) {
  const grouped = {
    FWD: players.filter((p) => p.position === "FWD").sort((a, b) => a.number - b.number),
    MID: players.filter((p) => p.position === "MID").sort((a, b) => a.number - b.number),
    DEF: players.filter((p) => p.position === "DEF").sort((a, b) => a.number - b.number),
    GK: players.filter((p) => p.position === "GK").sort((a, b) => a.number - b.number),
  };

  const rows: { key: string; label: string; group: Player[]; top: string }[] = [
    { key: "FWD", label: "FWD", group: grouped.FWD, top: "20%" },
    { key: "MID", label: "MID", group: grouped.MID, top: "40%" },
    { key: "DEF", label: "DEF", group: grouped.DEF, top: "60%" },
    { key: "GK",  label: "GK",  group: grouped.GK,  top: "79%" },
  ];

  return (
    <div className="relative w-full max-w-[580px] mx-auto rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: "3/4" }}>
      {/* Field background */}
      <div
        className="absolute inset-0"
        style={{
          background: "#2e7d32",
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 40px, rgba(0,0,0,0.07) 40px, rgba(0,0,0,0.07) 80px)",
        }}
      />

      {/* SVG field markings */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 300 400"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect x="8" y="8" width="284" height="384" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="2.5" />
        <line x1="8" y1="200" x2="292" y2="200" stroke="white" strokeOpacity="0.5" strokeWidth="2" />
        <circle cx="150" cy="200" r="42" fill="none" stroke="white" strokeOpacity="0.45" strokeWidth="2" />
        <circle cx="150" cy="200" r="3" fill="white" fillOpacity="0.6" />
        <rect x="68" y="8" width="164" height="80" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
        <rect x="108" y="8" width="84" height="28" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
        <rect x="126" y="2" width="48" height="10" fill="rgba(255,255,255,0.15)" stroke="white" strokeOpacity="0.6" strokeWidth="2" rx="1" />
        <circle cx="150" cy="68" r="2.5" fill="white" fillOpacity="0.55" />
        <path d="M 100 88 A 52 52 0 0 1 200 88" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
        <rect x="68" y="312" width="164" height="80" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
        <rect x="108" y="364" width="84" height="28" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
        <rect x="126" y="388" width="48" height="10" fill="rgba(255,255,255,0.15)" stroke="white" strokeOpacity="0.6" strokeWidth="2" rx="1" />
        <circle cx="150" cy="332" r="2.5" fill="white" fillOpacity="0.55" />
        <path d="M 100 312 A 52 52 0 0 0 200 312" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
        <path d="M 8 24 Q 8 8 24 8" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
        <path d="M 276 8 Q 292 8 292 24" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
        <path d="M 8 376 Q 8 392 24 392" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
        <path d="M 276 392 Q 292 392 292 376" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
      </svg>

      {/* Player rows */}
      {rows.map(({ key, label, group, top }) =>
        group.length > 0 ? (
          <div
            key={key}
            className="absolute left-0 right-0 px-3 flex justify-evenly items-end"
            style={{ top, transform: "translateY(-50%)" }}
          >
            {group.map((p) => (
              <PlayerToken key={p.id} player={p} onClick={onPlayerClick} />
            ))}
          </div>
        ) : null
      )}

      {/* Position labels */}
      {rows.map(({ key, label, top }) => (
        <div
          key={key}
          className="absolute pointer-events-none"
          style={{ top, left: "4%", transform: "translateY(-50%)" }}
        >
          <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">{label}</span>
        </div>
      ))}
    </div>
  );
}
