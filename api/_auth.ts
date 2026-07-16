import crypto from "node:crypto";
import { Redis } from "@upstash/redis";
import type { VercelRequest } from "@vercel/node";

export interface Account {
  id: string;
  name: string;
  pass: string;
}

export interface SessionUser {
  id: string;
  name: string;
}

export const STATE_KEY = "unme:state";
export const VERSION_KEY = "unme:state:version";

const DEFAULT_SECRET = "unme-dev-secret-please-change";

const DEFAULT_USERS: Account[] = [
  { id: "a", name: "Demo One", pass: "demo1" },
  { id: "b", name: "Demo Two", pass: "demo2" },
];

export function getSecret(): string {
  return process.env.UNME_SECRET || DEFAULT_SECRET;
}

/**
 * Two accounts from `UNME_USERS` (JSON array). Only falls back to demo
 * accounts when the var is entirely unset — a set-but-malformed value throws
 * so demo credentials can never work in a configured deployment.
 */
export function getUsers(): Account[] {
  const raw = process.env.UNME_USERS;
  if (!raw || !raw.trim()) return DEFAULT_USERS;
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("UNME_USERS must be a non-empty JSON array");
  }
  return parsed as Account[];
}

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

export function signToken(user: SessionUser): string {
  const payload = JSON.stringify({
    id: user.id,
    name: user.name,
    iat: Date.now(),
  });
  const encoded = b64url(payload);
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string | null | undefined): SessionUser | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  const a = new Uint8Array(Buffer.from(sig));
  const b = new Uint8Array(Buffer.from(expected));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    );
    if (!payload || typeof payload.id !== "string") return null;
    return { id: payload.id, name: payload.name };
  } catch {
    return null;
  }
}

export function bearerToken(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (!header || typeof header !== "string") return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export function getRedis(): Redis {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Redis is not configured. Set KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)."
    );
  }
  return new Redis({ url, token });
}
