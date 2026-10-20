import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { sanityClient, sanityWriteClient } from "@/lib/sanity/client";
import type { TeamSlug } from "@/lib/sanity/queries";

async function getTeamRef(team: TeamSlug): Promise<string | null> {
  const result = await sanityClient.fetch<{ _id: string } | null>(
    `*[_type == "team" && ageGroup == $team][0]{ _id }`,
    { team }
  );
  return result?._id ?? null;
}

export function extractYouTubeId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const pat of patterns) {
    const m = input.match(pat);
    if (m) return m[1];
  }
  return null;
}

export async function POST(req: NextRequest) {
  const authed = await getAdminSession();
  if (!authed) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { team, youtubeUrl, r2Url, title, event } = body as {
    team: TeamSlug;
    youtubeUrl?: string;
    r2Url?: string;
    title: string;
    event: string;
  };

  if (!team || !title?.trim() || !event?.trim()) {
    return Response.json({ error: "team, title, and event are required" }, { status: 400 });
  }
  if (!youtubeUrl?.trim() && !r2Url?.trim()) {
    return Response.json({ error: "Provide either a YouTube URL or an R2 video URL" }, { status: 400 });
  }

  let youtubeId: string | undefined;
  if (youtubeUrl?.trim()) {
    youtubeId = extractYouTubeId(youtubeUrl.trim()) ?? undefined;
    if (!youtubeId) {
      return Response.json({ error: "Could not parse a YouTube video ID from that URL" }, { status: 400 });
    }
  }

  const teamRef = await getTeamRef(team);
  if (!teamRef) return Response.json({ error: "Team not found" }, { status: 404 });

  const doc = await sanityWriteClient.create({
    _type: "highlightVideo",
    team: { _type: "reference", _ref: teamRef },
    ...(youtubeId ? { youtubeId } : {}),
    ...(r2Url?.trim() ? { r2Url: r2Url.trim() } : {}),
    title: title.trim(),
    event: event.trim(),
  });

  return Response.json({ id: doc._id, youtubeId, r2Url: r2Url?.trim() });
}
