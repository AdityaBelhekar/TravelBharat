// Passwords and session tokens, using only Node's crypto. No database access, so the proxy and tests can use it.
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "tb_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 characters.");
  return value;
}

const mac = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

// Token = base64url({ uid, exp }) + "." + HMAC of that. Changing AUTH_SECRET signs everyone out.
export function createSessionToken(userId: string, now = Date.now()) {
  const data = Buffer.from(JSON.stringify({ uid: userId, exp: now + SESSION_TTL_SECONDS * 1000 })).toString("base64url");
  return `${data}.${mac(data)}`;
}

// Returns the user id if the token is genuine and unexpired, otherwise null.
export function readSessionToken(token: string | undefined, now = Date.now()): string | null {
  const [data, signature] = token?.split(".") ?? [];
  if (!data || !signature) return null;
  const expected = Buffer.from(mac(data));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(data, "base64url").toString());
    return typeof uid === "string" && typeof exp === "number" && exp > now ? uid : null;
  } catch {
    return null;
  }
}

// scrypt with N=2^15 is roughly as slow to brute-force as bcrypt at cost 12.
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const derive = (password: string, salt: Buffer, length: number) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, length, SCRYPT, (err, key) => (err ? reject(err) : resolve(key))),
  );

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("base64")}$${(await derive(password, salt, 64)).toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  return timingSafeEqual(await derive(password, Buffer.from(salt, "base64"), expected.length), expected);
}
