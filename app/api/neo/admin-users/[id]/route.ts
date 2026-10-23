import { NextRequest, NextResponse } from "next/server";
import { getNeoSession } from "@/lib/neo-auth";
import {
  revokeAdminAccount,
  approveAdminAccount,
  deleteAdminAccount,
  resetAdminPassword,
  setAdminRole,
  type AdminRole,
} from "@/lib/admin-accounts";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = await getNeoSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let action: unknown, newPassword: unknown, role: unknown;
  try {
    ({ action, newPassword, role } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (action === "approve") {
    await approveAdminAccount(id);
    if (role === "admin" || role === "media_uploader") {
      await setAdminRole(id, role as AdminRole);
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "revoke") {
    await revokeAdminAccount(id);
    return NextResponse.json({ ok: true });
  }

  if (action === "reset-password") {
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    const ok = await resetAdminPassword(id, newPassword);
    if (!ok) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = await getNeoSession();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteAdminAccount(id);
  return NextResponse.json({ ok: true });
}
