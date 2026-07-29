import { NextResponse, type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { clientIp, hashIp } from "@/lib/track-headers";
import { preflight, withCors } from "@/lib/cors";
import { notifyDiscord } from "@/lib/discord";
import { sendSubscribeWelcomeEmail } from "@/lib/email";
import { unsubscribeUrl } from "@/lib/unsubscribe";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Gmail ignores dots and +tags in the local part; list-bombing bots exploit
 *  that to re-add one inbox many times past the unique constraint. Store the
 *  canonical form (delivery is unaffected). */
function canonicalEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${local.split("+")[0].replace(/\./g, "")}@gmail.com`;
  }
  return email;
}

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

  // Bot traps — fake success so bots don't learn (mirrors /api/booking):
  //  1. Honeypot: hidden _gotcha field only bots fill.
  //  2. Time-trap: form_ms is ms from first focus on the email field to submit.
  //     Unlike the other forms, missing form_ms is ALSO rejected here — this
  //     endpoint is a list-bombing target and our own client always sends it.
  const formMs = Number(body.form_ms);
  if (String(body._gotcha || "").trim() || !Number.isFinite(formMs) || formMs < 800) {
    return withCors(req, NextResponse.json({ ok: true }));
  }

  const email = canonicalEmail(String(body.email || "").trim().toLowerCase());
  const sourcePath = body.source_path ? String(body.source_path).trim().slice(0, 300) : null;

  if (!EMAIL_RE.test(email) || email.length > 200) {
    return withCors(req, NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 }));
  }

  const { data, error } = await getSupabase()
    .from("subscribers")
    .upsert(
      {
        email,
        source_path: sourcePath,
        ip_hash: hashIp(clientIp(req)),
        status: "active",
      },
      { onConflict: "email", ignoreDuplicates: true },
    )
    .select("email");

  if (error) {
    return withCors(req, NextResponse.json({ ok: false, error: "db" }, { status: 500 }));
  }

  // Only first-time subscribers get the welcome + Discord ping (ignoreDuplicates
  // returns an empty array for repeats).
  if (data && data.length > 0) {
    await sendSubscribeWelcomeEmail({
      email,
      unsubscribeUrl: unsubscribeUrl(req.nextUrl.origin, email),
    });
    await notifyDiscord("subscribers", {
      title: "New newsletter subscriber",
      fields: [
        { name: "Email", value: email, inline: true },
        { name: "Source", value: sourcePath ?? "", inline: true },
      ],
    });
  }

  return withCors(req, NextResponse.json({ ok: true }));
}
