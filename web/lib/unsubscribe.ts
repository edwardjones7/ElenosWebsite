import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Signed unsubscribe links: token = HMAC(email) so the link can't be forged
 *  to unsubscribe someone else. Keyed off IP_HASH_SALT — already required,
 *  stable, and rotating it only invalidates old links. */
function secret(): string {
  return process.env.IP_HASH_SALT || "";
}

export function unsubscribeToken(email: string): string {
  return createHmac("sha256", secret()).update(email.toLowerCase()).digest("hex").slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!secret() || !token) return false;
  const expected = Buffer.from(unsubscribeToken(email), "utf8");
  const given = Buffer.from(token, "utf8");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function unsubscribeUrl(origin: string, email: string): string {
  return `${origin}/api/unsubscribe/?email=${encodeURIComponent(email)}&token=${unsubscribeToken(email)}`;
}
