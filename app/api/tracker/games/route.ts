import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getRedis } from "@/lib/redis";
import type { TrackerGame } from "@/lib/types";

export async function GET(req: NextRequest) {
  const authed = await getAdminSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const redis = getRedis();
  if (!redis) return NextResponse.json({ games: [] });

  const ids = await redis.lrange("tracker:game:index", 0, -1);
  if (!ids.length) return NextResponse.json({ games: [] });

  const raw = await Promise.all(ids.map((id) => redis.get<TrackerGame>(`tracker:game:${id}`)));
  const games: TrackerGame[] = (raw.filter(Boolean) as TrackerGame[])
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return NextResponse.json({ games });
}
