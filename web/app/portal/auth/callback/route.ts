import { NextResponse, type NextRequest } from "next/server";
import { getPortalServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/portal";

  if (code) {
    const supabase = getPortalServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const redirect = new URL("/portal/login", req.url);
      redirect.searchParams.set("error", "link_invalid");
      return NextResponse.redirect(redirect);
    }
  }

  return NextResponse.redirect(new URL(next, req.url));
}
