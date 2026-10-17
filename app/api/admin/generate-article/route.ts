import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminSession } from "@/lib/admin-auth";
import { sanityWriteClient } from "@/lib/sanity/client";
import { sanityClient } from "@/lib/sanity/client";
import type { TeamSlug } from "@/lib/sanity/queries";

const anthropic = new Anthropic();

type Tone = "friendly" | "formal" | "hype";

async function getTeamRef(team: TeamSlug): Promise<{ id: string; name: string } | null> {
  const result = await sanityClient.fetch<{ _id: string; name: string } | null>(
    `*[_type == "team" && ageGroup == $team][0]{ _id, name }`,
    { team }
  );
  return result ? { id: result._id, name: result.name } : null;
}

function makeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) + "-" + Date.now();
}

function textToBlocks(text: string) {
  return text
    .split(/\n\n+/)
    .filter(Boolean)
    .map((para) => ({
      _type: "block",
      _key: Math.random().toString(36).slice(2, 10),
      style: "normal",
      children: [{ _type: "span", _key: Math.random().toString(36).slice(2, 10), text: para.trim(), marks: [] }],
      markDefs: [],
    }));
}

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  friendly: "Write in a warm, encouraging tone that parents and families will love. Celebrate effort as much as results.",
  formal: "Write in a professional, measured tone suitable for club communications. Factual and respectful.",
  hype: "Write with energy and excitement — pump up the team, celebrate big moments, use dynamic language that gets kids fired up.",
};

export async function POST(req: NextRequest) {
  const authed = await getAdminSession();
  if (!authed) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { team, matchData, tone = "friendly", author = "Coach", coachLanguage = "en", coachNotes, coverImageAssetId, freeFormContext } = body as {
    team: TeamSlug;
    matchData?: { id: string; date: string; opponent: string; location?: string; homeAway: string; goalsFor?: number | null; goalsAgainst?: number | null; result?: string | null; coachNotes?: string };
    tone?: Tone;
    author?: string;
    coachLanguage?: "en" | "es";
    coachNotes?: string;
    coverImageAssetId?: string;
    freeFormContext?: string;
  };

  if (!team) {
    return Response.json({ error: "team is required" }, { status: 400 });
  }
  if (!matchData && !freeFormContext?.trim()) {
    return Response.json({ error: "Either matchData or freeFormContext is required" }, { status: 400 });
  }

  const teamInfo = await getTeamRef(team);
  if (!teamInfo) return Response.json({ error: "Team not found" }, { status: 404 });

  let articleContext: string;

  if (matchData) {
    articleContext = [
      `Team: ${teamInfo.name}`,
      `Opponent: ${matchData.opponent}`,
      `Date: ${new Date(matchData.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`,
      `Home/Away: ${matchData.homeAway}`,
      matchData.result
        ? `Score: ${matchData.goalsFor ?? 0} – ${matchData.goalsAgainst ?? 0}`
        : "Result: Upcoming match",
      matchData.result
        ? `Result: ${matchData.result === "W" ? "Win" : matchData.result === "L" ? "Loss" : "Draw"}`
        : null,
      matchData.location ? `Location: ${matchData.location}` : null,
      coachNotes?.trim() ? `Coach notes (written in ${coachLanguage === "es" ? "Spanish" : "English"}): ${coachNotes.trim()}` : matchData.coachNotes ? `Coach notes: ${matchData.coachNotes}` : null,
    ].filter(Boolean).join("\n");
  } else {
    articleContext = [
      `Team: ${teamInfo.name}`,
      coachNotes?.trim() ? `Coach notes (written in ${coachLanguage === "es" ? "Spanish" : "English"}): ${coachNotes.trim()}` : null,
      `Context (written in ${coachLanguage === "es" ? "Spanish" : "English"}): ${freeFormContext!.trim()}`,
    ].filter(Boolean).join("\n");
  }

  const prompt = `You are writing a short article for a youth soccer team website. ${TONE_INSTRUCTIONS[tone]}

Context:
${articleContext}

Write a bilingual article (English + Spanish). Return a JSON object with this exact shape:
{
  "title_en": "...",
  "title_es": "...",
  "excerpt_en": "one sentence summary in English",
  "excerpt_es": "one sentence summary in Spanish",
  "body_en": "3-4 paragraphs in English",
  "body_es": "3-4 paragraphs in Spanish"
}

Keep each language version 150-250 words. Return ONLY the JSON object.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return Response.json({ error: "Claude returned no text" }, { status: 502 });
  }

  let article: {
    title_en: string; title_es: string;
    excerpt_en: string; excerpt_es: string;
    body_en: string; body_es: string;
  };
  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    article = JSON.parse(jsonMatch?.[0] ?? textBlock.text);
  } catch {
    return Response.json({ error: "Failed to parse Claude response" }, { status: 502 });
  }

  const slug = makeSlug(article.title_en);
  const publishedAt = new Date().toISOString();

  const doc = await sanityWriteClient.create({
    _type: "post",
    team: { _type: "reference", _ref: teamInfo.id },
    title: article.title_en,
    title_es: article.title_es,
    slug: { _type: "slug", current: slug },
    excerpt: article.excerpt_en,
    excerpt_es: article.excerpt_es,
    body: textToBlocks(article.body_en),
    body_es: textToBlocks(article.body_es),
    publishedAt,
    author,
    ...(coverImageAssetId ? { coverImage: { _type: "image", asset: { _type: "reference", _ref: coverImageAssetId } } } : {}),
    ...(matchData ? { sourceMatchId: matchData.id } : {}),
    ...(!matchData && freeFormContext?.trim() ? { sourceFreeFormContext: freeFormContext.trim() } : {}),
    status: "draft",
  });

  return Response.json({
    id: doc._id,
    slug,
    title: article.title_en,
    title_es: article.title_es,
    excerpt: article.excerpt_en,
    excerpt_es: article.excerpt_es,
    body_en: article.body_en,
    body_es: article.body_es,
    sourceMatchId: matchData?.id ?? null,
    sourceFreeFormContext: !matchData ? (freeFormContext?.trim() ?? null) : null,
    status: "draft",
  });
}
