import { NextResponse, type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { clientIp, hashIp } from "@/lib/track-headers";
import { preflight, withCors } from "@/lib/cors";
import { notifyDiscord } from "@/lib/discord";
import { sendLeadUnlockEmail } from "@/lib/email";

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

  const name = String(body.name || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().toLowerCase();
  const sourcePath = body.source_path ? String(body.source_path).trim().slice(0, 300) : null;
  const utmSource = body.utm_source ? String(body.utm_source).trim().slice(0, 80) : null;
  const utmMedium = body.utm_medium ? String(body.utm_medium).trim().slice(0, 80) : null;
  const utmCampaign = body.utm_campaign ? String(body.utm_campaign).trim().slice(0, 80) : null;

  if (!name) {
    return withCors(req, NextResponse.json({ ok: false, error: "invalid_name" }, { status: 400 }));
  }
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return withCors(req, NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 }));
  }

  // Upsert so a returning lead can re-request the unlock email (lost it, typo'd
  // their spam filter, etc.) without tripping the unique constraint.
  const { data, error } = await getSupabase()
    .from("leads")
    .upsert(
      {
        name,
        email,
        source_path: sourcePath,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        ip_hash: hashIp(clientIp(req)),
      },
      { onConflict: "email", ignoreDuplicates: false },
    )
    .select("id, created_at, emailed_at");

  if (error) {
    return withCors(req, NextResponse.json({ ok: false, error: "db" }, { status: 500 }));
  }

  const lead = data && data[0];
  const isNew = !lead?.emailed_at;

  const { sent } = await sendLeadUnlockEmail({ name, email });

  if (lead) {
    await getSupabase()
      .from("leads")
      .update(
        sent
          ? { status: "emailed", emailed_at: new Date().toISOString() }
          : { status: "email_failed" },
      )
      .eq("id", lead.id);
  }

  // Only ping Discord for first-time unlocks; re-sends would be noise.
  if (isNew) {
    await notifyDiscord("leads", {
      title: sent ? "New lead unlocked /learn" : "New lead — email FAILED, follow up manually",
      fields: [
        { name: "Name", value: name, inline: true },
        { name: "Email", value: email, inline: true },
        { name: "Source", value: utmSource ?? "direct", inline: true },
        { name: "Campaign", value: utmCampaign ?? "", inline: true },
        { name: "Path", value: sourcePath ?? "", inline: false },
      ],
    });
  }

  // When the email couldn't be sent, hand back the Discord invite so the lead
  // isn't left stranded (the invite is already public on the main site footer).
  return withCors(
    req,
    NextResponse.json(
      sent
        ? { ok: true, emailed: true }
        : { ok: true, emailed: false, discord_invite: process.env.DISCORD_INVITE_URL || null },
    ),
  );
}
