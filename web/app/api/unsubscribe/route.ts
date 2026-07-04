import { NextResponse, type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

export const runtime = "nodejs";

function page(title: string, body: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} — Elenos</title></head>
<body style="margin:0;background:#000;color:#fff;font-family:Helvetica,Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;">
  <div style="max-width:420px;padding:40px 24px;">
    <h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;margin:0 0 12px;">${title}</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0;">${body}</p>
  </div>
</body></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  const token = req.nextUrl.searchParams.get("token") || "";

  if (!email || !verifyUnsubscribeToken(email, token)) {
    return page("That link didn't work", "It may be old or incomplete. Email ed@elenos.ai and we'll take you off the list by hand.");
  }

  const { error } = await getSupabase()
    .from("subscribers")
    .update({ status: "unsubscribed" })
    .eq("email", email);

  if (error) {
    return page("Something broke", "We couldn't process that just now. Email ed@elenos.ai and we'll take you off the list by hand.");
  }

  return page("You're unsubscribed", "No more emails from the Elenos letter. Change your mind anytime — the signup is on elenos.ai.");
}
