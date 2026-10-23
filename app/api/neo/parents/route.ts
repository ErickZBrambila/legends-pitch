import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getAllAccounts } from "@/lib/parent-auth";

const NEO_COOKIE = "nlfc_neo";

function verifyNeoToken(token: string): boolean {
  const expected = createHash("sha256")
    .update((process.env.THE_ONE ?? "") + "-nlfc-neo-2026")
    .digest("hex");
  return token === expected;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(NEO_COOKIE)?.value;
  if (!token || !verifyNeoToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await getAllAccounts();
  return NextResponse.json(accounts);
}
