import { NextRequest, NextResponse } from "next/server";
import { toggleCommunityVote, WISHLIST_SLUGS } from "@/lib/votes";

export async function POST(req: NextRequest) {
  const { slug, hasVoted } = await req.json();

  if (!WISHLIST_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const newCount = await toggleCommunityVote(slug, hasVoted);
  return NextResponse.json({ slug, communityCount: newCount });
}
