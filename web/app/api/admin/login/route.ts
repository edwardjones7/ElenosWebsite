import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { signAdminToken, adminCookie } from "@/lib/auth";

export const runtime = "nodejs";

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  const expectedOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN;
  const origin = req.headers.get("origin");
  if (expectedOrigin && origin && origin !== expectedOrigin) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 });
  }

  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: "bad_body" }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || !safeEq(password, expected)) {
    await sleep(300 + Math.random() * 200);
    return NextResponse.json({ ok: false, error: "wrong_password" }, { status: 401 });
  }

  const token = await signAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: adminCookie.name,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: adminCookie.ttl,
  });
  return res;
}
