import { createHash } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "nlfc_admin";

export function hashPassword(password: string): string {
  return createHash("sha256")
    .update(password + "-nlfc-admin-2026")
    .digest("hex");
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const expected = hashPassword(process.env.ADMIN_PASSWORD ?? "");
  return token === expected;
}

export { COOKIE_NAME };
