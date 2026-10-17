import { NextRequest, NextResponse } from "next/server";
import { getParentSession, claimPlayer, releasePlayer } from "@/lib/parent-auth";

export async function POST(req: NextRequest) {
  const account = await getParentSession();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!account.approved) return NextResponse.json({ error: "Account pending approval" }, { status: 403 });

  let playerId: unknown;
  try {
    ({ playerId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof playerId !== "string" || !playerId || playerId.length > 100) {
    return NextResponse.json({ error: "Invalid playerId" }, { status: 400 });
  }

  const result = await claimPlayer(account.id, playerId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const account = await getParentSession();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let playerId: unknown;
  try {
    ({ playerId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof playerId !== "string" || !playerId || playerId.length > 100) {
    return NextResponse.json({ error: "Invalid playerId" }, { status: 400 });
  }

  await releasePlayer(account.id, playerId);
  return NextResponse.json({ ok: true });
}
