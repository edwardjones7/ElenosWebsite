import { NextResponse, type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { clientIp, hashIp } from "@/lib/track-headers";
import { preflight, withCors } from "@/lib/cors";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return withCors(req, NextResponse.json({ ok: false, error: "bad_body" }, { status: 400 }));
  }

  const email = String(body.email || "").trim().toLowerCase();
  const sourcePath = body.source_path ? String(body.source_path).trim().slice(0, 300) : null;

  if (!EMAIL_RE.test(email) || email.length > 200) {
    return withCors(req, NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 }));
  }

  const { error } = await getSupabase()
    .from("subscribers")
    .upsert(
      {
        email,
        source_path: sourcePath,
        ip_hash: hashIp(clientIp(req)),
        status: "active",
      },
      { onConflict: "email", ignoreDuplicates: true },
    );

  if (error) {
    return withCors(req, NextResponse.json({ ok: false, error: "db" }, { status: 500 }));
  }

  return withCors(req, NextResponse.json({ ok: true }));
}
