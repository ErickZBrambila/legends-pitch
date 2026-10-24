import { NextRequest, NextResponse } from "next/server";
import { NEO_COOKIE, verifyNeoToken } from "@/lib/neo-auth";
import { getAllAccounts } from "@/lib/parent-auth";


export async function GET(req: NextRequest) {
  const token = req.cookies.get(NEO_COOKIE)?.value;
  if (!token || !verifyNeoToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await getAllAccounts();
  return NextResponse.json(accounts);
}
