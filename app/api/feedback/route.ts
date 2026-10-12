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
    const { name, email, type, message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await writeClient.create({
      _type: "feedback",
      name: name?.trim() || "Anonymous",
      email: email?.trim() || null,
      feedbackType: type || "general",
      message: message.trim(),
      submittedAt: new Date().toISOString(),
      status: "new",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("feedback error:", err);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
