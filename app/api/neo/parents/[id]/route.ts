import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { approveAccount, revokeAccount, deleteAccount } from "@/lib/parent-auth";

const NEO_COOKIE = "nlfc_neo";

function verifyNeoToken(token: string): boolean {
  const expected = createHash("sha256")
    .update((process.env.THE_ONE ?? "") + "-nlfc-neo-2026")
    .digest("hex");
  return token === expected;
}

function validateId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id.length <= 100;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get(NEO_COOKIE)?.value;
  if (!token || !verifyNeoToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!validateId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("approved" in body) ||
    typeof (body as Record<string, unknown>).approved !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Body must include { approved: boolean }" },
      { status: 400 }
    );
  }

  const { approved } = body as { approved: boolean };

  if (approved) {
    await approveAccount(id);
  } else {
    await revokeAccount(id);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get(NEO_COOKIE)?.value;
  if (!token || !verifyNeoToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!validateId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await deleteAccount(id);
  return NextResponse.json({ ok: true });
}
