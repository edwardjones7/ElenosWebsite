import { NextResponse, type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { clientIp, hashIp, clientCountry } from "@/lib/track-headers";
import { preflight, withCors } from "@/lib/cors";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["pageview", "cta_click", "calendly_click", "form_submit"]);

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return withCors(req, new NextResponse(null, { status: 400 }));
  }

  const type = String(body.type || "");
  const path = String(body.path || "");
  const sessionId = String(body.session_id || "");
  if (!ALLOWED_TYPES.has(type) || !path || !sessionId) {
    return withCors(req, new NextResponse(null, { status: 400 }));
  }

  const referrer = body.referrer ? String(body.referrer).slice(0, 500) : null;
  const meta =
    body.meta && typeof body.meta === "object" && !Array.isArray(body.meta) ? body.meta : null;

  await getSupabase().from("events").insert({
    type,
    path: path.slice(0, 300),
    referrer,
    session_id: sessionId.slice(0, 64),
    ip_hash: hashIp(clientIp(req)),
    country: clientCountry(req),
    meta,
  });

  return withCors(req, new NextResponse(null, { status: 204 }));
}
