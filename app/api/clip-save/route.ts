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
    const { sessionId, videoKey, clipKey } = await req.json() as {
      sessionId: string;
      videoKey: string;
      clipKey: string;
    };

    if (!sessionId || !videoKey || !clipKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Increment saveCount on the specific clip using Sanity's path selector syntax
    const path = `videos[_key=="${videoKey}"].clips[_key=="${clipKey}"].saveCount`;
    await writeClient.patch(sessionId).inc({ [path]: 1 }).commit();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("clip-save error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
