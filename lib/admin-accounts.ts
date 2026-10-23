import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto";
import { cookies } from "next/headers";
import { Redis } from "@upstash/redis";

// ── types ──────────────────────────────────────────────────────────────────

export type AdminRole = "admin" | "media_uploader";

export type AdminAccount = {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  approved: boolean;
  revoked: boolean;
  createdAt: string;
};

type StoredAccount = AdminAccount & { passwordHash: string };

// ── constants ──────────────────────────────────────────────────────────────

export const ADMIN_COOKIE = "nlfc_admin";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) {
    console.warn("[admin-accounts] ADMIN_SESSION_SECRET not set — using insecure dev fallback");
    return "dev-fallback-admin-secret-change-in-prod";
  }
  return s;
}

// ── redis ──────────────────────────────────────────────────────────────────

function makeRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function redisKey(type: "account" | "email" | "all" | "revoked", id?: string): string {
  if (type === "all") return "admins:all";
  if (type === "revoked") return "admins:revoked";
  if (type === "account") return `admin:account:${id}`;
  return `admin:email:${id}`;
}

// ── password hashing ───────────────────────────────────────────────────────

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPasswordHash(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const derived = scryptSync(password, salt, 64);
    return timingSafeEqual(derived, Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

// ── session tokens ─────────────────────────────────────────────────────────

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function createAdminSession(account: AdminAccount): string {
  const secret = getSecret();
  const payload = b64url(
    Buffer.from(JSON.stringify({ id: account.id, role: account.role, exp: Date.now() + COOKIE_MAX_AGE * 1000 }))
  );
  const sig = b64url(createHmac("sha256", secret).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string): { id: string; role: AdminRole } | null {
  const secret = getSecret();
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = b64url(createHmac("sha256", secret).update(payload).digest());
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  } catch {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    if (Date.now() > decoded.exp) return null;
    return { id: decoded.id, role: decoded.role as AdminRole };
  } catch {
    return null;
  }
}

// ── session cookie helper ──────────────────────────────────────────────────

export async function getAdminSession(): Promise<AdminAccount | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const parsed = verifyAdminSessionToken(token);
  if (!parsed) return null;

  const redis = makeRedis();
  if (!redis) return null;

  try {
    // Fail closed on revocation check
    const isRevoked = await redis.sismember(redisKey("revoked"), parsed.id);
    if (isRevoked) return null;

    const stored = await redis.get<StoredAccount>(redisKey("account", parsed.id));
    if (!stored || !stored.approved) return null;

    const { passwordHash: _, ...account } = stored;
    return account;
  } catch {
    return null;
  }
}

// ── account CRUD ───────────────────────────────────────────────────────────

export async function createAdminAccount(
  email: string,
  displayName: string,
  password: string,
  role: AdminRole
): Promise<{ account: AdminAccount } | { error: string }> {
  const redis = makeRedis();
  if (!redis) return { error: "Service unavailable" };

  const normalizedEmail = email.toLowerCase().trim();
  const id = randomBytes(12).toString("hex");

  // Atomic email uniqueness check
  const emailSet = await redis.set(redisKey("email", normalizedEmail), id, { nx: true });
  if (!emailSet) return { error: "Email already registered" };

  const account: AdminAccount = {
    id,
    email: normalizedEmail,
    displayName,
    role,
    approved: false,
    revoked: false,
    createdAt: new Date().toISOString(),
  };

  const stored: StoredAccount = { ...account, passwordHash: hashPassword(password) };

  await Promise.all([
    redis.set(redisKey("account", id), JSON.stringify(stored)),
    redis.sadd(redisKey("all"), id),
  ]);

  return { account };
}

export async function verifyAdminPassword(
  email: string,
  password: string
): Promise<AdminAccount | null> {
  const redis = makeRedis();
  if (!redis) return null;

  const normalizedEmail = email.toLowerCase().trim();
  const id = await redis.get<string>(redisKey("email", normalizedEmail));
  if (!id) return null;

  const stored = await redis.get<StoredAccount>(redisKey("account", id));
  if (!stored) return null;
  if (!stored.approved) return null;

  if (!verifyPasswordHash(password, stored.passwordHash)) return null;

  const { passwordHash: _, ...account } = stored;
  return account;
}

export async function getAllAdminAccounts(): Promise<AdminAccount[]> {
  const redis = makeRedis();
  if (!redis) return [];

  const ids = await redis.smembers(redisKey("all"));
  if (!ids.length) return [];

  const accounts = await Promise.all(
    ids.map((id) => redis.get<StoredAccount>(redisKey("account", id)))
  );

  return accounts
    .filter((a): a is StoredAccount => !!a)
    .map(({ passwordHash: _, ...a }) => a)
    .sort((a, b) => (!a.approved ? -1 : !b.approved ? 1 : 0));
}

export async function revokeAdminAccount(id: string): Promise<void> {
  const redis = makeRedis();
  if (!redis) return;

  const stored = await redis.get<StoredAccount>(redisKey("account", id));
  if (!stored) return;

  const updated = { ...stored, approved: false, revoked: true };
  await Promise.all([
    redis.set(redisKey("account", id), JSON.stringify(updated)),
    redis.sadd(redisKey("revoked"), id),
  ]);
}

export async function approveAdminAccount(id: string): Promise<void> {
  const redis = makeRedis();
  if (!redis) return;

  const stored = await redis.get<StoredAccount>(redisKey("account", id));
  if (!stored) return;

  const updated = { ...stored, approved: true, revoked: false };
  await Promise.all([
    redis.set(redisKey("account", id), JSON.stringify(updated)),
    redis.srem(redisKey("revoked"), id),
  ]);
}

export async function deleteAdminAccount(id: string): Promise<void> {
  const redis = makeRedis();
  if (!redis) return;

  const stored = await redis.get<StoredAccount>(redisKey("account", id));
  if (!stored) return;

  await Promise.all([
    redis.del(redisKey("account", id)),
    redis.del(redisKey("email", stored.email)),
    redis.srem(redisKey("all"), id),
    redis.srem(redisKey("revoked"), id),
  ]);
}

export async function resetAdminPassword(id: string, newPassword: string): Promise<boolean> {
  const redis = makeRedis();
  if (!redis) return false;

  const stored = await redis.get<StoredAccount>(redisKey("account", id));
  if (!stored) return false;

  const updated: StoredAccount = { ...stored, passwordHash: hashPassword(newPassword) };
  await redis.set(redisKey("account", id), JSON.stringify(updated));
  return true;
}

export async function setAdminRole(id: string, role: AdminRole): Promise<void> {
  const redis = makeRedis();
  if (!redis) return;
  const stored = await redis.get<StoredAccount>(redisKey("account", id));
  if (!stored) return;
  await redis.set(redisKey("account", id), JSON.stringify({ ...stored, role }));
}

export async function hasAnyAdminAccount(): Promise<boolean> {
  const redis = makeRedis();
  if (!redis) return false;
  try {
    const count = await redis.scard(redisKey("all"));
    return count > 0;
  } catch {
    return false;
  }
}
