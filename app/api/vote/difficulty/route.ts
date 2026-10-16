import { NextRequest, NextResponse } from "next/server";
import { setDifficulty, WISHLIST_SLUGS, type Difficulty } from "@/lib/votes";
import { getNeoSession } from "@/lib/neo-auth";

export async function POST(req: NextRequest) {
  const authed = await getNeoSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, difficulty } = await req.json();
  if (!WISHLIST_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  await setDifficulty(slug, difficulty as Difficulty);
  return NextResponse.json({ slug, difficulty });
}
