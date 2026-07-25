import { NextResponse, type NextRequest } from "next/server";

function allowedOrigins(): string[] {
  const raw = process.env.PUBLIC_ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_SITE_ORIGIN || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin");
  const allow = allowedOrigins();
  const ok = origin && (allow.length === 0 || allow.includes(origin));
  if (!ok || !origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function preflight(req: NextRequest): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export function withCors(req: NextRequest, res: NextResponse): NextResponse {
  const headers = corsHeaders(req);
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
}
