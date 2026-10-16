import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { broadcastPush } from "@/lib/push";
import { getAdminSession } from "@/lib/admin-auth";
import { sanityWriteClient } from "@/lib/sanity/client";
import { sanityClient } from "@/lib/sanity/client";
import type { TeamSlug } from "@/lib/sanity/queries";

const anthropic = new Anthropic();

async function getTeamRef(team: TeamSlug): Promise<string | null> {
  const result = await sanityClient.fetch<{ _id: string } | null>(
    `*[_type == "team" && ageGroup == $team][0]{ _id }`,
    { team }
  );
  return result?._id ?? null;
}

function textToPortableBlock(text: string) {
  return {
    _type: "block",
    _key: Math.random().toString(36).slice(2, 10),
    style: "normal",
    children: [{ _type: "span", _key: Math.random().toString(36).slice(2, 10), text, marks: [] }],
    markDefs: [],
  };
}

export async function POST(req: NextRequest) {
  const authed = await getAdminSession();
  if (!authed) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { team, message, language, author, location, locationLat, locationLng, eventTime, imageAssetId } = body as {
    team: TeamSlug;
    message: string;
    language: "en" | "es";
    author: string;
    location?: string;
    locationLat?: number;
    locationLng?: number;
    eventTime?: string;
    imageAssetId?: string;
  };

  if (!team || !message?.trim() || !author?.trim()) {
    return Response.json({ error: "team, message, and author are required" }, { status: 400 });
  }

  const teamRef = await getTeamRef(team);
  if (!teamRef) return Response.json({ error: "Team not found" }, { status: 404 });

  const sourceLang = language === "es" ? "es" : "en";
  const [fromLang, toLang] = sourceLang === "en"
    ? ["English", "Spanish"]
    : ["Spanish", "English"];

  let translated: string | null = null;
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Translate the following youth soccer coach announcement from ${fromLang} to natural, friendly ${toLang}. Return ONLY the translated text — no preamble, no quotes.\n\n${message}`,
        },
      ],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock?.type === "text") translated = textBlock.text.trim();
  } catch {
    // Translation is best-effort — proceed without it
  }

  const message_en = sourceLang === "en" ? message.trim() : (translated ?? message.trim());
  const message_es = sourceLang === "es" ? message.trim() : (translated ?? null);

  const doc = await sanityWriteClient.create({
    _type: "announcement",
    team: { _type: "reference", _ref: teamRef },
    message: message_en,
    ...(message_es ? { message_es } : {}),
    author: author.trim(),
    publishedAt: new Date().toISOString(),
    ...(location ? { location } : {}),
    ...(locationLat != null ? { locationLat } : {}),
    ...(locationLng != null ? { locationLng } : {}),
    ...(eventTime ? { eventTime } : {}),
    ...(imageAssetId ? { image: { _type: "image", asset: { _type: "reference", _ref: imageAssetId } } } : {}),
  });

  // Fire-and-forget — push failure must never block the admin response
  broadcastPush(
    `📢 ${author.trim()}`,
    message.trim().slice(0, 140),
    "/announcements"
  ).catch(() => {});

  return Response.json({ id: doc._id, message_en, message_es, translated, sourceLang });
}
