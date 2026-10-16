import { NextResponse } from "next/server";
import { getAllVotes } from "@/lib/votes";

export const dynamic = "force-dynamic";

export async function GET() {
  const votes = await getAllVotes();
  return NextResponse.json(votes);
}
