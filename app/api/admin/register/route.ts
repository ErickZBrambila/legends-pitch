import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { createAdminAccount } from "@/lib/admin-accounts";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "register");
  if (limited) return limited;

  let email: unknown, displayName: unknown, password: unknown;
  try {
    ({ email, displayName, password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (
    typeof email !== "string" ||
    !email.includes("@") ||
    typeof displayName !== "string" ||
    displayName.trim().length < 1 ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  const result = await createAdminAccount(email, displayName.trim(), password, "admin");

  if ("error" in result) {
    if (result.error === "Service unavailable") {
      return NextResponse.json({ error: result.error }, { status: 503 });
    }
    // Email already registered (duplicate)
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  // Do NOT set a session cookie — account is pending approval
  return NextResponse.json({ ok: true }, { status: 201 });
}
