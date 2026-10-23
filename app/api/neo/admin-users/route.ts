import { NextRequest, NextResponse } from "next/server";
import { getNeoSession } from "@/lib/neo-auth";
import { getAllAdminAccounts, createAdminAccount, type AdminRole } from "@/lib/admin-accounts";

export async function GET() {
  const authed = await getNeoSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await getAllAdminAccounts();
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const authed = await getNeoSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let email: unknown, displayName: unknown, password: unknown, role: unknown;
  try {
    ({ email, displayName, password, role } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (
    typeof email !== "string" || !email.includes("@") ||
    typeof displayName !== "string" || displayName.length < 1 ||
    typeof password !== "string" || password.length < 8 ||
    (role !== "admin" && role !== "media_uploader")
  ) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  const result = await createAdminAccount(email, displayName, password, role as AdminRole);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.error === "Service unavailable" ? 503 : 409 });
  }

  return NextResponse.json(result.account, { status: 201 });
}
