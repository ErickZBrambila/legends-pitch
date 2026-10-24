import { createHash } from "crypto";
import { cookies } from "next/headers";

const NEO_COOKIE = "nlfc_neo";

function hashNeoPassword(password: string): string {
  return createHash("sha256")
    .update(password + "-nlfc-neo-2026")
    .digest("hex");
}

// Refuses when THE_ONE is unset — otherwise sha256("-nlfc-neo-2026") would
// be a valid cookie that anyone can compute.
export function verifyNeoToken(token: string | undefined): boolean {
  const password = process.env.THE_ONE;
  if (!password || !token) return false;
  return token === hashNeoPassword(password);
}

export async function getNeoSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyNeoToken(cookieStore.get(NEO_COOKIE)?.value);
}

export { NEO_COOKIE, hashNeoPassword };
