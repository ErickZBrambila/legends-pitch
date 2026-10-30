import { getTranslations } from "next-intl/server";
import ChampionshipWatchButton from "./ChampionshipWatchButton";
import ChampionshipCountdown from "./ChampionshipCountdown";

interface Props {
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  rank: number | null;
  team: string;
}

function rankBadge(rank: number | null): string {
  if (rank === 1) return "★ #1 · Table Leaders";
  if (rank === 2) return "#2 · Fighting for the Top";
  if (rank !== null) return `#${rank} in the Table`;
  return "Fall Championship";
}

export default async function ChampionshipSection({ wins, losses, draws, goalsFor, goalsAgainst, rank, team }: Props) {
  const t = await getTranslations("Championship");

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0d0d0f 0%, #1a1408 40%, #1c1c1e 100%)",
        borderBottom: "1px solid rgba(212,175,55,0.2)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="text-3xl leading-none">🏆</div>
          <div>
            <p className="text-[#d4af37] text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-0.5">
              {t("badge")}
            </p>
            <p className="text-[#d4af37]/50 text-[10px] uppercase tracking-widest">{t("year")}</p>
          </div>
          <div className="ml-auto">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black"
              style={{
                background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))",
                border: "1px solid rgba(212,175,55,0.45)",
                color: "#d4af37",
              }}
            >
              {rankBadge(rank)}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* W / D / L */}
          {[
            { value: wins,   label: t("wins"),   color: "text-green-400",  border: "border-green-500/20",  bg: "bg-green-500/8" },
            { value: draws,  label: t("draws"),  color: "text-yellow-400", border: "border-yellow-500/20", bg: "bg-yellow-500/8" },
            { value: losses, label: t("losses"), color: "text-red-400",    border: "border-red-500/20",    bg: "bg-red-500/8" },
          ].map(({ value, label, color, border, bg }) => (
            <div
              key={label}
              className={`${bg} ${border} border rounded-2xl py-4 text-center`}
            >
              <p className={`${color} text-3xl font-black leading-none`}>{value}</p>
              <p className={`${color} text-[9px] uppercase tracking-widest mt-1.5 opacity-60`}>{label}</p>
            </div>
          ))}

          {/* Goals For */}
          <div className="bg-white/5 border border-white/10 rounded-2xl py-4 text-center">
            <p className="text-white text-3xl font-black leading-none">{goalsFor}</p>
            <p className="text-white/40 text-[9px] uppercase tracking-widest mt-1.5">{t("goalsFor")}</p>
          </div>

          {/* Goals Against */}
          <div className="bg-white/5 border border-white/10 rounded-2xl py-4 text-center">
            <p className="text-white text-3xl font-black leading-none">{goalsAgainst}</p>
            <p className="text-white/40 text-[9px] uppercase tracking-widest mt-1.5">{t("goalsAgainst")}</p>
          </div>
        </div>

        {/* Flip-board countdown */}
        <div className="mt-5 max-w-sm mx-auto">
          <ChampionshipCountdown />
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-center">
          <ChampionshipWatchButton />
        </div>
      </div>

      {/* Bottom gold border */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
    </section>
  );
}
