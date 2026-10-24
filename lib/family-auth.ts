import { createHash } from "crypto";
import { cookies } from "next/headers";

export const FAMILY_COOKIE = "nlfc_family";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 6 months

export function hashPasscode(passcode: string): string {
  return createHash("sha256")
    .update(passcode + "-nlfc-family-2026")
    .digest("hex");
}

// Returns null when FAMILY_PASSCODE is unset. Previously an unset passcode
// made the expected cookie sha256("-nlfc-family-2026"), which anyone can compute.
export function generateMagicToken(): string | null {
  const passcode = process.env.FAMILY_PASSCODE;
  if (!passcode) return null;
  return createHash("sha256")
    .update(passcode + "-nlfc-magic-link-2026")
    .digest("hex");
}

/** Expected family cookie value, or null if the family gate isn't configured. */
export function expectedFamilyToken(): string | null {
  const passcode = process.env.FAMILY_PASSCODE;
  if (!passcode) return null;
  return hashPasscode(passcode);
}

export function isValidFamilyToken(token: string | undefined): boolean {
  const expected = expectedFamilyToken();
  return !!expected && !!token && token === expected;
}

export async function getFamilySession(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidFamilyToken(cookieStore.get(FAMILY_COOKIE)?.value);
}
