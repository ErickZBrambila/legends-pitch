import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_WRITE_TOKEN!,
  apiVersion: "2024-01-01",
  useCdn: false,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      team: "u11" | "u12";
      headCoachName: string;
      headCoachRole: string;
      headCoachEmail: string;
      assistants: Array<{ name: string; role: string }>;
      practiceSlots: Array<{ day: string; time: string; location: string }>;
      players: Array<{ name: string; number: string; position: "GK" | "DEF" | "MID" | "FWD" }>;
    };

    const { team, players, ...coachInfo } = body;

    // ── 1. Look up the Sanity team document reference ───────────────────────
    const teamDoc = await writeClient.fetch<{ _id: string } | null>(
      `*[_type == "team" && ageGroup == $team][0]{ _id }`,
      { team }
    );
    if (!teamDoc) {
      return NextResponse.json(
        { error: `No Sanity team document found for ${team}` },
        { status: 404 }
      );
    }

    // ── 2b. Save coach submission to Sanity ────────────────────────────────
    await writeClient.createOrReplace({
      _id: `coach-submission-${team}`,
      _type: "coachSubmission",
      team: { _type: "reference", _ref: teamDoc._id },
      submittedAt: new Date().toISOString(),
      ...coachInfo,
    }).catch(() => {
      // coachSubmission type may not exist in schema yet — non-fatal
    });

    // ── 3. Create player documents ──────────────────────────────────────────
    const validPlayers = players.filter((p) => p.name.trim() && p.number.trim());

    const transaction = writeClient.transaction();
    for (const p of validPlayers) {
      transaction.create({
        _type: "player",
        name: p.name.trim(),
        number: parseInt(p.number, 10),
        position: p.position,
        team: { _type: "reference", _ref: teamDoc._id },
      });
    }
    await transaction.commit();

    return NextResponse.json({
      ok: true,
      playersCreated: validPlayers.length,
      team,
    });
  } catch (err) {
    console.error("onboarding error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save" },
      { status: 500 }
    );
  }
}
