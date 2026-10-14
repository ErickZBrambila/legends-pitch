import { createHash } from "crypto";
import { cookies } from "next/headers";

const NEO_COOKIE = "nlfc_neo";

function hashNeoPassword(password: string): string {
  return createHash("sha256")
    .update(password + "-nlfc-neo-2026")
    .digest("hex");
}

export async function getNeoSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(NEO_COOKIE)?.value;
  if (!token) return false;
  const expected = hashNeoPassword(process.env.THE_ONE ?? "");
  return token === expected;
}

export { NEO_COOKIE, hashNeoPassword };
