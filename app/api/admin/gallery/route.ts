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

export async function POST(req: NextRequest) {
  const authed = await getAdminSession();
  if (!authed) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { team, title, date, images } = body as {
    team: TeamSlug;
    title: string;
    date: string;
    images: Array<{ assetId: string; alt: string }>;
  };

  if (!team || !title?.trim() || !date || !images?.length) {
    return Response.json({ error: "team, title, date, and at least one image are required" }, { status: 400 });
  }

  const teamRef = await getTeamRef(team);
  if (!teamRef) return Response.json({ error: "Team not found" }, { status: 404 });

  const doc = await sanityWriteClient.create({
    _type: "galleryEvent",
    team: { _type: "reference", _ref: teamRef },
    title: title.trim(),
    date,
    images: images.map((img) => ({
      _key: Math.random().toString(36).slice(2, 10),
      image: { _type: "image", asset: { _type: "reference", _ref: img.assetId } },
      alt: img.alt ?? "",
    })),
  });

  return Response.json({ id: doc._id });
}
