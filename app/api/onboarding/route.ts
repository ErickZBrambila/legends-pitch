import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_WRITE_TOKEN!,
  apiVersion: "2024-01-01",
  useCdn: false,
});

const POSITIONS = new Set(["GK", "DEF", "MID", "FWD"]);
const MAX_ASSISTANTS = 20;
const MAX_SLOTS = 20;
const MAX_PLAYERS = 60;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  // Disabled by default — activate on demand by setting ONBOARDING_ENABLED=true in Vercel env
  if (process.env.ONBOARDING_ENABLED !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const body = (raw ?? {}) as Record<string, unknown>;

    // ── Validate + normalize input ──────────────────────────────────────────
    const team = body.team === "u12" ? "u12" : body.team === "u11" ? "u11" : null;
    if (!team) {
      return NextResponse.json({ error: "Invalid team" }, { status: 400 });
    }

    const headCoachName = str(body.headCoachName, 200);
    const headCoachRole = str(body.headCoachRole, 200);
    const headCoachEmail = str(body.headCoachEmail, 254);

    const assistantsIn = Array.isArray(body.assistants) ? body.assistants : [];
    const assistants = assistantsIn
      .slice(0, MAX_ASSISTANTS)
      .map((a) => {
        const o = (a ?? {}) as Record<string, unknown>;
        return { name: str(o.name, 200), role: str(o.role, 200) };
      })
      .filter((a) => a.name);

    const slotsIn = Array.isArray(body.practiceSlots) ? body.practiceSlots : [];
    const practiceSlots = slotsIn
      .slice(0, MAX_SLOTS)
      .map((s) => {
        const o = (s ?? {}) as Record<string, unknown>;
        return { day: str(o.day, 50), time: str(o.time, 50), location: str(o.location, 200) };
      })
      .filter((s) => s.day || s.time || s.location);

    const playersIn = Array.isArray(body.players) ? body.players : [];
    const validPlayers = playersIn
      .slice(0, MAX_PLAYERS)
      .map((p) => {
        const o = (p ?? {}) as Record<string, unknown>;
        const position = POSITIONS.has(o.position as string) ? (o.position as string) : "MID";
        return { name: str(o.name, 200), number: str(o.number, 10), position };
      })
      .filter((p) => p.name && p.number);

    const coachInfo = { headCoachName, headCoachRole, headCoachEmail, assistants, practiceSlots };

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

    // ── 2. Save coach submission to Sanity ──────────────────────────────────
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
    const transaction = writeClient.transaction();
    for (const p of validPlayers) {
      const num = parseInt(p.number, 10);
      transaction.create({
        _type: "player",
        name: p.name,
        number: Number.isFinite(num) ? num : 0,
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
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
