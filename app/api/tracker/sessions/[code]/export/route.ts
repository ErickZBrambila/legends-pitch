import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

// Merge windows per event family (seconds)
const WINDOWS: Record<string, number> = {
  goal: 25,
  rival_goal: 25,
  shot: 15,   // shot_on, shot_off, save
  card: 40,   // yellow_card, red_card
  sub: 40,    // substitution
};

function family(type: string): string {
  if (type === "goal" || type === "rival_goal") return type;
  if (type === "shot_on" || type === "shot_off" || type === "save") return "shot";
  if (type === "yellow_card" || type === "red_card") return "card";
  return "sub";
}

function taggerWeight(ev: Record<string, unknown>, primaryId: string): number {
  let w = ev.confidence === "sure" ? 2 : 1;
  if (ev.taggerId === primaryId) w += 1;
  return w;
}

function mergeEvents(
  events: Record<string, unknown>[],
  primaryTaggerId: string
): { merged: Record<string, unknown>[]; disputes: Record<string, unknown>[] } {
  // Remove tombstones
  const live = events.filter((e) => !e.deletedAt);

  // Group by family, sort by wallTimestamp within each group
  const byFamily: Record<string, Record<string, unknown>[]> = {};
  for (const ev of live) {
    const f = family(ev.type as string);
    if (!byFamily[f]) byFamily[f] = [];
    byFamily[f].push(ev);
  }

  const merged: Record<string, unknown>[] = [];
  const disputes: Record<string, unknown>[] = [];

  for (const [fam, fevents] of Object.entries(byFamily)) {
    const sorted = [...fevents].sort(
      (a, b) => new Date(a.wallTimestamp as string).getTime() - new Date(b.wallTimestamp as string).getTime()
    );
    const window = WINDOWS[fam] ?? 25;

    // Cluster by time window
    const clusters: Record<string, unknown>[][] = [];
    for (const ev of sorted) {
      const t = new Date(ev.wallTimestamp as string).getTime();
      const last = clusters[clusters.length - 1];
      const lastT = last
        ? new Date(last[last.length - 1].wallTimestamp as string).getTime()
        : -Infinity;
      if (last && t - lastT <= window * 1000) {
        last.push(ev);
      } else {
        clusters.push([ev]);
      }
    }

    // Resolve each cluster to one canonical event
    for (const cluster of clusters) {
      if (cluster.length === 1) {
        merged.push({ ...cluster[0], taggerCount: 1, disputed: false });
        continue;
      }

      // Median wallTimestamp
      const times = cluster
        .map((e) => new Date(e.wallTimestamp as string).getTime())
        .sort((a, b) => a - b);
      const medianTs = new Date(times[Math.floor(times.length / 2)]).toISOString();

      // Weighted vote on playerName
      const playerVotes: Record<string, number> = {};
      for (const ev of cluster) {
        const name = (ev.playerName as string) || "";
        if (!name) continue;
        playerVotes[name] = (playerVotes[name] || 0) + taggerWeight(ev, primaryTaggerId);
      }
      const sortedPlayers = Object.entries(playerVotes).sort((a, b) => b[1] - a[1]);
      const topPlayer = sortedPlayers[0]?.[0] || "";
      const secondPlayer = sortedPlayers[1]?.[0] || "";
      const isDisputed = !!(
        topPlayer &&
        secondPlayer &&
        sortedPlayers[0][1] === sortedPlayers[1][1]
      );

      // Assist: take from highest-weight voter that has one
      const assistVoter = [...cluster]
        .sort((a, b) => taggerWeight(b, primaryTaggerId) - taggerWeight(a, primaryTaggerId))
        .find((e) => e.assistPlayerName);

      // Type: majority vote within cluster (most specific wins on tie: save > shot_on > shot_off)
      const typePriority = ["save", "shot_on", "shot_off", "goal", "rival_goal", "yellow_card", "red_card", "substitution"];
      const typeVotes: Record<string, number> = {};
      for (const ev of cluster) {
        const t = ev.type as string;
        typeVotes[t] = (typeVotes[t] || 0) + 1;
      }
      const resolvedType = Object.entries(typeVotes)
        .sort((a, b) => b[1] - a[1] || typePriority.indexOf(a[0]) - typePriority.indexOf(b[0]))
        [0][0];

      // half/minute: prefer primary's values
      const primaryEv = cluster.find((e) => e.taggerId === primaryTaggerId);
      const canonical = primaryEv || cluster[0];

      const result: Record<string, unknown> = {
        id: (primaryEv || cluster[0]).id,
        type: resolvedType,
        half: canonical.half,
        minute: canonical.minute,
        wallTimestamp: medianTs,
        playerName: topPlayer,
        assistPlayerName: assistVoter?.assistPlayerName || "",
        taggerCount: cluster.length,
        sourceTaggers: cluster.map((e) => e.taggerId),
        disputed: isDisputed,
      };

      merged.push(result);

      if (isDisputed) {
        disputes.push({
          eventId: result.id,
          type: resolvedType,
          minute: canonical.minute,
          candidates: sortedPlayers.map(([name, votes]) => ({ name, votes })),
        });
      }
    }
  }

  // Sort by wallTimestamp ascending
  merged.sort(
    (a, b) => new Date(a.wallTimestamp as string).getTime() - new Date(b.wallTimestamp as string).getTime()
  );

  return { merged, disputes };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });

  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const session = await redis.hgetall(`tracker:session:${code}`);
  if (!session || Object.keys(session).length === 0) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const [rawEvents, rawTaggers] = await Promise.all([
    redis.hgetall(`tracker:session:${code}:events`),
    redis.hgetall(`tracker:session:${code}:taggers`),
  ]);

  const events = rawEvents
    ? (Object.values(rawEvents).map((v) => (typeof v === "string" ? JSON.parse(v) : v)) as Record<string, unknown>[])
    : [];

  const taggers = rawTaggers
    ? Object.values(rawTaggers).map((v) => (typeof v === "string" ? JSON.parse(v) : v))
    : [];

  const primaryTaggerId = (session.primaryTaggerId as string) || "";
  const { merged, disputes } = mergeEvents(events, primaryTaggerId);

  const goals = merged.filter((e) => e.type === "goal");
  const rivalGoals = merged.filter((e) => e.type === "rival_goal");

  const exportDoc = {
    schemaVersion: 2,
    sessionCode: code,
    matchId: session.matchId || "",
    teamAgeGroup: session.teamAgeGroup,
    opponent: session.opponent,
    homeAway: session.homeAway,
    date: session.date,
    submittedAt: new Date().toISOString(),
    mergedFrom: taggers.map((t: Record<string, unknown>) => `${code}/${t.taggerId}`),
    events: merged,
    disputes,
    finalScore: { home: goals.length, away: rivalGoals.length },
  };

  return NextResponse.json(exportDoc, {
    headers: {
      "Content-Disposition": `attachment; filename="tracker-${code}-${session.date}.json"`,
    },
  });
}
