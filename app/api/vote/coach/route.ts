import { NextRequest, NextResponse } from "next/server";
import { toggleCoachVote, WISHLIST_SLUGS } from "@/lib/votes";
import { getAdminSession } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const authed = await getAdminSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await req.json();
  if (!WISHLIST_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const coachVoted = await toggleCoachVote(slug);
  return NextResponse.json({ slug, coachVoted });
}
