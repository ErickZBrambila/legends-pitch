import { NextRequest, NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity/client";

export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team") ?? "u11";

  // Run the exact query getLatestSessionWithReel uses
  const result = await sanityClient.fetch(
    `*[_type in ["practiceSession","gameSession"] && team->ageGroup == $team && defined(compilationUrl)]{
      _id, sessionName, compilationTitle, sessionDate, "teamRef": team._ref
    } | order(sessionDate desc)`,
    { team },
    { cache: "no-store" }
  );

  return NextResponse.json({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "(fallback:build-placeholder)",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "(fallback:production)",
    team,
    resultCount: Array.isArray(result) ? result.length : "not-array",
    results: result,
  });
}
