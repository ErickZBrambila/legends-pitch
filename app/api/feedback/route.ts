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

const ALLOWED_TYPES = new Set(["general", "bug", "feature", "idea", "praise"]);

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "feedback");
  if (limited) return limited;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { name, email, type, message } = (body ?? {}) as Record<string, unknown>;

    const cleanMessage = str(message, 5000);
    if (!cleanMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const cleanEmail = str(email, 254);
    // Lightweight email shape check — reject obviously malformed values but
    // keep it permissive (empty is allowed).
    const emailOk = !cleanEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

    const cleanType = str(type, 32).toLowerCase();

    await writeClient.create({
      _type: "feedback",
      name: str(name, 200) || "Anonymous",
      email: emailOk && cleanEmail ? cleanEmail : null,
      feedbackType: ALLOWED_TYPES.has(cleanType) ? cleanType : "general",
      message: cleanMessage,
      submittedAt: new Date().toISOString(),
      status: "new",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("feedback error:", err);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
