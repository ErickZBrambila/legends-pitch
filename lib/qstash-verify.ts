import { Receiver } from "@upstash/qstash";
import { NextRequest, NextResponse } from "next/server";

/**
 * Verifies that a request really came from Upstash QStash.
 *
 * Previously the cron routes only checked that an `upstash-signature` header
 * was *present*, so anyone could POST a fake payload and broadcast a push
 * notification to every subscribed family. This checks the JWT signature
 * against the signing keys from the Upstash console and fails closed if the
 * keys are not configured.
 *
 * Required env (Upstash console → QStash → Signing Keys):
 *   QSTASH_CURRENT_SIGNING_KEY
 *   QSTASH_NEXT_SIGNING_KEY
 *
 * Returns the raw body on success, or a 401/500 response to return directly.
 */
export async function verifyQStashRequest(
  req: NextRequest
): Promise<{ body: string } | { error: NextResponse }> {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) {
    console.error("[qstash] signing keys not configured — rejecting request");
    return {
      error: NextResponse.json({ error: "Not configured" }, { status: 500 }),
    };
  }

  const signature = req.headers.get("upstash-signature");
  if (!signature) {
    return {
      error: NextResponse.json({ error: "Missing QStash signature" }, { status: 401 }),
    };
  }

  // The signature covers the exact raw body, so read it as text before parsing.
  const body = await req.text();

  try {
    const receiver = new Receiver({ currentSigningKey, nextSigningKey });
    const valid = await receiver.verify({ signature, body });
    if (!valid) throw new Error("invalid signature");
  } catch {
    return {
      error: NextResponse.json({ error: "Invalid QStash signature" }, { status: 401 }),
    };
  }

  return { body };
}
