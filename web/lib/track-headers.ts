import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

export function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || null;
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT;
  if (!salt) return null;
  return createHash("sha256").update(salt + "|" + ip).digest("hex").slice(0, 32);
}

export function clientCountry(req: NextRequest): string | null {
  return (
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-country") ||
    null
  );
}
