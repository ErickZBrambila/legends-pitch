import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { rateLimit } from "@/lib/ratelimit";

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_WRITE_TOKEN!,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// Sanity _key values and document ids are restricted character sets. We build a
// GROQ *path selector* string from these values (parameters can't be used
// inside a path selector), so they MUST be validated to prevent GROQ injection.
const KEY_RE = /^[a-zA-Z0-9]{1,64}$/; // _key: random alphanumeric
const ID_RE = /^[a-zA-Z0-9._-]{1,128}$/; // document _id

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "save");
  if (limited) return limited;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { sessionId, videoKey, clipKey } = (body ?? {}) as {
      sessionId?: unknown;
      videoKey?: unknown;
      clipKey?: unknown;
    };

    if (
      typeof sessionId !== "string" ||
      typeof videoKey !== "string" ||
      typeof clipKey !== "string"
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!ID_RE.test(sessionId) || !KEY_RE.test(videoKey) || !KEY_RE.test(clipKey)) {
      return NextResponse.json({ error: "Invalid identifier" }, { status: 400 });
    }

    // Increment saveCount on the specific clip using Sanity's path selector
    // syntax. Inputs are validated above against a strict charset.
    const path = `videos[_key=="${videoKey}"].clips[_key=="${clipKey}"].saveCount`;
    await writeClient.patch(sessionId).inc({ [path]: 1 }).commit();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("clip-save error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
