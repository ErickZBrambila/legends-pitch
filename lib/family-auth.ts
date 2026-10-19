import { createHash } from "crypto";
import { cookies } from "next/headers";

export const FAMILY_COOKIE = "nlfc_family";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 6 months

export function hashPasscode(passcode: string): string {
  return createHash("sha256")
    .update(passcode + "-nlfc-family-2026")
    .digest("hex");
}

export function generateMagicToken(): string {
  return createHash("sha256")
    .update((process.env.FAMILY_PASSCODE ?? "") + "-nlfc-magic-link-2026")
    .digest("hex");
}

export async function getFamilySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(FAMILY_COOKIE)?.value;
  if (!token) return false;
  const expected = hashPasscode(process.env.FAMILY_PASSCODE ?? "");
  return token === expected;
}
