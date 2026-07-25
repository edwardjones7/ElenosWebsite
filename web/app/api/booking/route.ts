import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { preflight, withCors } from "@/lib/cors";
import { clientIp, hashIp } from "@/lib/track-headers";
import { assertSlotBookable } from "@/lib/booking-slots";
import { createBooking, setBookingEvent } from "@/lib/bookings";
import { createEvent, googleConfigured } from "@/lib/google-calendar";
import { notifyDiscord } from "@/lib/discord";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { BOOKING_CONFIG } from "@/lib/booking-config";
import { formatWhen, googleCalendarUrl, manageUrl } from "@/lib/booking-format";

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

  // Bot traps — silently drop with a fake success so bots don't learn.
  //  1. Honeypot: the hidden _gotcha field only bots fill (mirrors /api/contact).
  //  2. Time-trap: a real person can't select a slot, fill the form, and submit
  //     in under ~0.8s; a script can. form_ms is the ms between the details form
  //     appearing and submit. Missing/invalid (non-form clients) is not penalized.
  const formMs = Number(body.form_ms);
  if (String(body._gotcha || "").trim() || (Number.isFinite(formMs) && formMs >= 0 && formMs < 800)) {
    return withCors(req, NextResponse.json({ ok: true }));
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const slot = String(body.slot || "").trim();
  const timezone = body.timezone ? String(body.timezone).trim().slice(0, 64) : null;
  const company = body.company ? String(body.company).trim() : null;
  const message = body.message ? String(body.message).trim() : null;
  const sourcePath = body.source_path ? String(body.source_path).trim() : null;

  if (!name || !EMAIL_RE.test(email) || !slot) {
    return withCors(req, NextResponse.json({ ok: false, error: "invalid" }, { status: 400 }));
  }
  if (name.length > 200 || email.length > 200 || (message && message.length > 5000)) {
    return withCors(req, NextResponse.json({ ok: false, error: "too_long" }, { status: 400 }));
  }

  // Re-check the slot is still bookable (rules + Google busy + existing bookings).
  const check = await assertSlotBookable(slot);
  if (!check.ok) {
    const status = check.reason === "invalid" ? 400 : 409;
    return withCors(req, NextResponse.json({ ok: false, error: check.reason }, { status }));
  }
  const startsAt = slot;
  const endsAt = check.endISO!;

  const manageToken = randomBytes(24).toString("hex");
  const created = await createBooking({
    name,
    email,
    company,
    message,
    starts_at: startsAt,
    ends_at: endsAt,
    timezone,
    manage_token: manageToken,
    source_path: sourcePath,
    ip_hash: hashIp(clientIp(req)),
  });
  if (created.slotTaken || !created.booking) {
    return withCors(req, NextResponse.json({ ok: false, error: "slot_taken" }, { status: 409 }));
  }
  const booking = created.booking;

  // Create the Google Calendar event + Meet link. Best-effort: if it fails, the
  // booking still stands and we tell them the link will follow.
  let meetUrl: string | null = null;
  if (googleConfigured()) {
    try {
      const ev = await createEvent({
        summary: `Elenos discovery call — ${name}`,
        description: [
          `Booked via elenos.ai/book`,
          `Name: ${name}`,
          `Email: ${email}`,
          company ? `Company: ${company}` : "",
          message ? `Notes: ${message}` : "",
          ``,
          `Manage: ${manageUrl(manageToken)}`,
        ]
          .filter(Boolean)
          .join("\n"),
        startISO: startsAt,
        endISO: endsAt,
        timeZone: BOOKING_CONFIG.timezone,
      });
      meetUrl = ev.meetUrl;
      await setBookingEvent(booking.id, { meet_url: ev.meetUrl, gcal_event_id: ev.eventId });
    } catch (err) {
      console.error("google calendar event creation failed", err);
    }
  }

  const whenLabel = formatWhen(startsAt, timezone);
  await sendBookingConfirmationEmail({
    name,
    email,
    whenLabel,
    meetUrl,
    addToCalendarUrl: googleCalendarUrl({
      startISO: startsAt,
      endISO: endsAt,
      title: "Elenos discovery call",
      details: meetUrl ? `Join: ${meetUrl}` : "Elenos discovery call",
    }),
    manageUrl: manageUrl(manageToken),
  });

  await notifyDiscord("bookings", {
    title: "📅 New booking",
    fields: [
      { name: "Name", value: name, inline: true },
      { name: "Email", value: email, inline: true },
      { name: "When", value: `${whenLabel}` },
      { name: "Meet", value: meetUrl || "(link pending)" },
      { name: "Company", value: company ?? "", inline: true },
      { name: "Notes", value: message ?? "" },
    ],
  });

  return withCors(
    req,
    NextResponse.json({
      ok: true,
      booking: {
        starts_at: startsAt,
        ends_at: endsAt,
        timezone,
        meet_url: meetUrl,
        manage_token: manageToken,
      },
    }),
  );
}
