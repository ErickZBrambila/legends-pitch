import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getRedis } from "./redis";

export const PARENT_COOKIE = "nlfc_parent";
const SESSION_SALT = "-nlfc-parent-2026";
const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

export type ParentAccount = {
  id: string;
  email: string;
  displayName: string;
  playerName: string;
  createdAt: number;
  approved: boolean;
};

type StoredAccount = ParentAccount & { passwordHash: string };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password + SESSION_SALT, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function verifyPassword(stored: string, candidate: string): Promise<boolean> {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;
  try {
    const candidateHash = scryptSync(candidate + SESSION_SALT, salt, 64).toString("hex");
    const a = Buffer.from(storedHash, "hex");
    const b = Buffer.from(candidateHash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function getSessionSecret(): string {
  const secret = process.env.PARENT_SESSION_SECRET;
  if (!secret) {
    console.warn("PARENT_SESSION_SECRET not set — using insecure dev fallback");
    return "dev-parent-secret-2026-nlfc";
  }
  return secret;
}

function toBase64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf;
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromBase64url(s: string): Buffer {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

export function generateSessionToken(accountId: string): string {
  const expiry = Date.now() + SESSION_EXPIRY_MS;
  const payload = toBase64url(`${accountId}:${expiry}`);
  const secret = getSessionSecret();
  const sig = toBase64url(createHmac("sha256", secret).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const secret = getSessionSecret();
  const expectedSig = toBase64url(createHmac("sha256", secret).update(payload).digest());
  const sigBuf = fromBase64url(sig);
  const expectedBuf = fromBase64url(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  const decoded = fromBase64url(payload).toString();
  const colon = decoded.lastIndexOf(":");
  if (colon === -1) return null;
  const accountId = decoded.slice(0, colon);
  const expiry = parseInt(decoded.slice(colon + 1), 10);
  if (isNaN(expiry) || Date.now() > expiry) return null;
  return accountId;
}

export async function getParentSession(): Promise<ParentAccount | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PARENT_COOKIE)?.value;
  if (!token) return null;
  const accountId = verifySessionToken(token);
  if (!accountId) return null;
  return getAccountById(accountId);
}

export async function createAccount(opts: {
  email: string;
  displayName: string;
  playerName: string;
  password: string;
}): Promise<{ account: ParentAccount } | { error: string }> {
  const redis = getRedis();
  if (!redis) return { error: "Service unavailable" };

  const emailKey = `parent:email:${opts.email.toLowerCase()}`;
  const existing = await redis.get(emailKey);
  if (existing) return { error: "Email already registered" };

  const id = randomBytes(16).toString("hex");
  const passwordHash = await hashPassword(opts.password);
  const account: ParentAccount = {
    id,
    email: opts.email.toLowerCase(),
    displayName: opts.displayName,
    playerName: opts.playerName,
    createdAt: Date.now(),
    approved: true,
  };
  const stored: StoredAccount = { ...account, passwordHash };

  await redis.set(`parent:account:${id}`, JSON.stringify(stored));
  await redis.set(emailKey, id);
  await redis.sadd("parents:all", id);

  return { account };
}

export async function getAccountByEmail(email: string): Promise<StoredAccount | null> {
  const redis = getRedis();
  if (!redis) return null;
  const id = await redis.get<string>(`parent:email:${email.toLowerCase()}`);
  if (!id) return null;
  const raw = await redis.get<string>(`parent:account:${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAccount;
  } catch {
    return null;
  }
}

export async function getAccountById(id: string): Promise<ParentAccount | null> {
  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get<string>(`parent:account:${id}`);
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as StoredAccount;
    const { passwordHash: _ph, ...account } = stored;
    void _ph;
    return account;
  } catch {
    return null;
  }
}

export async function getAllAccounts(): Promise<ParentAccount[]> {
  const redis = getRedis();
  if (!redis) return [];
  const ids = await redis.smembers<string[]>("parents:all");
  if (!ids || ids.length === 0) return [];
  const results = await Promise.all(ids.map((id) => getAccountById(id)));
  return results.filter((a): a is ParentAccount => a !== null);
}

export async function approveAccount(id: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const raw = await redis.get<string>(`parent:account:${id}`);
  if (!raw) return;
  try {
    const stored = JSON.parse(raw) as StoredAccount;
    stored.approved = true;
    await redis.set(`parent:account:${id}`, JSON.stringify(stored));
  } catch {
    // no-op
  }
}

export async function revokeAccount(id: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const raw = await redis.get<string>(`parent:account:${id}`);
  if (!raw) return;
  try {
    const stored = JSON.parse(raw) as StoredAccount;
    stored.approved = false;
    await redis.set(`parent:account:${id}`, JSON.stringify(stored));
  } catch {
    // no-op
  }
}

export async function deleteAccount(id: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const raw = await redis.get<string>(`parent:account:${id}`);
  if (!raw) return;
  try {
    const stored = JSON.parse(raw) as StoredAccount;
    await redis.del(`parent:account:${id}`);
    await redis.del(`parent:email:${stored.email}`);
    await redis.srem("parents:all", id);
  } catch {
    // no-op
  }
}
