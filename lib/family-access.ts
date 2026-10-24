import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getFamilySession } from "./family-auth";
import { getParentSession } from "./parent-auth";
import { getAdminSession } from "./admin-accounts";

/**
 * True if the current request belongs to a team family: a valid family
 * passcode cookie, an approved (non-revoked) parent account, or a coach/admin.
 *
 * Pages with kids' photos and videos call this themselves instead of relying
 * only on middleware, so a middleware bypass (e.g. a Next.js advisory) or a
 * matcher mistake doesn't expose them.
 */
export async function hasFamilyAccess(): Promise<boolean> {
  if (await getFamilySession()) return true;
  if (await getParentSession()) return true;
  if (await getAdminSession()) return true;
  return false;
}

/** For server components: redirect to the family login if not allowed. */
export async function requireFamilyAccess(nextPath: string): Promise<void> {
  if (!(await hasFamilyAccess())) {
    redirect(`/family?next=${encodeURIComponent(safeNextPath(nextPath))}`);
  }
}

/** For API routes: returns a 401 response to send, or null to continue. */
export async function familyAccessDenied(): Promise<NextResponse | null> {
  if (await hasFamilyAccess()) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Only allow same-site relative paths as post-login destinations.
 * "//evil.com" and "/\\evil.com" start with "/" but are treated by browsers
 * as links to another site, so they're rejected.
 */
export function safeNextPath(next: string | undefined | null, fallback = "/videos"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}
