import { SignJWT, jwtVerify } from "jose";

const ADMIN_COOKIE = "elenos_admin";
const ALG = "HS256";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const raw = process.env.ADMIN_SESSION_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET is missing or too short (need ≥32 chars).");
  }
  return new TextEncoder().encode(raw);
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ sub: "admin" })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    return true;
  } catch {
    return false;
  }
}

export const adminCookie = {
  name: ADMIN_COOKIE,
  ttl: SESSION_TTL_SECONDS,
};
