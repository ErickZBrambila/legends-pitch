import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getRedis } from "@/lib/redis";
import type { TrackerGame } from "@/lib/types";
import KickReelAdmin from "./KickReelAdmin";

export const metadata = { title: "KickReel Stats · Admin" };

export default async function AdminKickReelPage() {
  const authed = await getAdminSession();
  if (!authed) redirect("/admin");

  const redis = getRedis();
  let games: TrackerGame[] = [];

  if (redis) {
    const ids = await redis.lrange("tracker:game:index", 0, -1);
    if (ids.length) {
      const raw = await Promise.all(ids.map((id) => redis.get<string>(`tracker:game:${id}`)));
      games = raw
        .filter(Boolean)
        .map((v) => (typeof v === "string" ? JSON.parse(v) : v) as TrackerGame)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }
  }

  return <KickReelAdmin initialGames={games} />;
}
