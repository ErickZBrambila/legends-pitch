import { NextResponse } from "next/server";
import { getParentSession } from "@/lib/parent-auth";

export async function GET() {
  const account = await getParentSession();
  if (!account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ account });
}
