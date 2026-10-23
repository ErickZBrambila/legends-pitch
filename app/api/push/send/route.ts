import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminSession } from "@/lib/admin-auth";
import { broadcastPush } from "@/lib/push";

const anthropic = new Anthropic();

async function translatePush(
  title: string,
  message: string,
  fromLang: string,
  toLang: string
): Promise<{ title: string; message: string }> {
  const parts = [`Title: ${title}`];
  if (message) parts.push(`Message: ${message}`);

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Translate the following youth soccer coach push notification fields from ${fromLang} to natural, friendly ${toLang}. Return JSON with keys "title" and "message". Return ONLY the JSON object.\n\n${parts.join("\n")}`,
      },
    ],
  });
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No translation returned");
  const parsed = JSON.parse(textBlock.text.trim()) as { title?: string; message?: string };
  return {
    title: parsed.title ?? title,
    message: parsed.message ?? message,
  };
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { title, message, url, senderName, language } = (body ?? {}) as Record<string, unknown>;
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const sender = typeof senderName === "string" && senderName.trim()
    ? senderName.trim()
    : session.displayName;

  const srcLang = language === "es" ? "es" : "en";
  const [fromLang, toLang] = srcLang === "en" ? ["English", "Spanish"] : ["Spanish", "English"];
  const titleStr = title.trim();
  const messageStr = typeof message === "string" ? message.trim() : "";

  let finalTitle = titleStr;
  let finalMessage = messageStr;

  try {
    const translated = await translatePush(titleStr, messageStr, fromLang, toLang);
    finalTitle = `${titleStr} · ${translated.title}`;
    finalMessage = [messageStr, translated.message].filter(Boolean).join("\n\n");
  } catch {
    // Translation is best-effort — proceed with original if it fails
    console.warn("[push] translation failed, sending original only");
  }

  console.log(`[push] sent by ${sender} (${session.email}): "${titleStr}"`);

  const sent = await broadcastPush(
    finalTitle.slice(0, 100),
    finalMessage.slice(0, 300),
    typeof url === "string" ? url : "/"
  );

  return NextResponse.json({ ok: true, sent });
}
