import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing with Node's built-in scrypt — no native dependencies, so it
 * builds and runs cleanly inside the Alpine standalone Docker image. Stored
 * format is `salt:derivedKey`, both hex. Passwords are NEVER stored in plaintext
 * and the raw value never leaves this module.
 */

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEYLEN = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(plain, salt, KEYLEN);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** Constant-time verification. Returns false on any malformed stored value. */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = await scrypt(plain, salt, expected.length || KEYLEN);
  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  );
}
