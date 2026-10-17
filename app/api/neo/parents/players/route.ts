import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { adminAssignPlayer, adminReleasePlayer } from "@/lib/parent-auth";

const NEO_COOKIE = "nlfc_neo";

function verifyNeoToken(token: string): boolean {
  const expected = createHash("sha256")
    .update((process.env.THE_ONE ?? "") + "-nlfc-neo-2026")
    .digest("hex");
  return token === expected;
}

// POST /api/neo/parents/players — admin force-assigns a player to an account.
// Body: { accountId: string, playerId: string }
export async function POST(req: NextRequest) {
  const token = req.cookies.get(NEO_COOKIE)?.value;
  if (!token || !verifyNeoToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let accountId: unknown, playerId: unknown;
  try {
    ({ accountId, playerId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (
    typeof accountId !== "string" || !accountId || accountId.length > 100 ||
    typeof playerId !== "string" || !playerId || playerId.length > 100
  ) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  await adminAssignPlayer(accountId, playerId);
  return NextResponse.json({ ok: true });
}

// DELETE /api/neo/parents/players — admin force-releases a player from whoever owns it.
// Body: { playerId: string }
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(NEO_COOKIE)?.value;
  if (!token || !verifyNeoToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let playerId: unknown;
  try {
    ({ playerId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof playerId !== "string" || !playerId || playerId.length > 100) {
    return NextResponse.json({ error: "Invalid playerId" }, { status: 400 });
  }

  await adminReleasePlayer(playerId);
  return NextResponse.json({ ok: true });
}
