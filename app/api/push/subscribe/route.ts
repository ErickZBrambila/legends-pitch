import { NextRequest, NextResponse } from "next/server";
import { saveSubscription, removeSubscription } from "@/lib/push";
import type webpush from "web-push";

export async function POST(req: NextRequest) {
  let subscription: unknown;
  try {
    subscription = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (
    typeof subscription !== "object" ||
    subscription === null ||
    !("endpoint" in subscription) ||
    typeof (subscription as Record<string, unknown>).endpoint !== "string"
  ) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await saveSubscription(subscription as webpush.PushSubscription);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const endpoint =
    typeof body === "object" && body !== null && "endpoint" in body
      ? (body as { endpoint: string }).endpoint
      : null;

  if (!endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 });

  await removeSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
