import { NextResponse, type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { preflight, withCors } from "@/lib/cors";
import { notifyDiscord } from "@/lib/discord";
import { sendContactAckEmail } from "@/lib/email";

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

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();
  const company = body.company ? String(body.company).trim() : null;
  const projectType = body.project_type ? String(body.project_type).trim() : null;
  const sourcePath = body.source_path ? String(body.source_path).trim() : null;

  if (!name || !message || !EMAIL_RE.test(email)) {
    return withCors(req, NextResponse.json({ ok: false, error: "invalid" }, { status: 400 }));
  }
  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    return withCors(req, NextResponse.json({ ok: false, error: "too_long" }, { status: 400 }));
  }

  const { error } = await getSupabase().from("contacts").insert({
    name,
    email,
    company,
    project_type: projectType,
    message,
    source_path: sourcePath,
  });

  if (error) {
    return withCors(req, NextResponse.json({ ok: false, error: "db" }, { status: 500 }));
  }

  await sendContactAckEmail({ name, email });

  await notifyDiscord("contacts", {
    title: "New contact form submission",
    fields: [
      { name: "Name", value: name, inline: true },
      { name: "Email", value: email, inline: true },
      { name: "Company", value: company ?? "", inline: true },
      { name: "Project type", value: projectType ?? "", inline: true },
      { name: "Source", value: sourcePath ?? "", inline: true },
      { name: "Message", value: message },
    ],
  });

  return withCors(req, NextResponse.json({ ok: true }));
}
