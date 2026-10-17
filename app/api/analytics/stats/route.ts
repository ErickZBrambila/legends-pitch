import { NextResponse } from "next/server";
import { getNeoSession } from "@/lib/neo-auth";
import { getAnalytics } from "@/lib/analytics";

export async function GET() {
  const authed = await getNeoSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getAnalytics();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
