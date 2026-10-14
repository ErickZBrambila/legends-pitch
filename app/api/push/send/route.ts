import { NextRequest, NextResponse } from "next/server";
import { getNeoSession } from "@/lib/neo-auth";
import { broadcastPush } from "@/lib/push";

export async function POST(req: NextRequest) {
  const authed = await getNeoSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { title, message, url } = (body ?? {}) as Record<string, unknown>;
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const sent = await broadcastPush(
    title,
    typeof message === "string" ? message : "",
    typeof url === "string" ? url : "/"
  );

  return NextResponse.json({ ok: true, sent });
}
