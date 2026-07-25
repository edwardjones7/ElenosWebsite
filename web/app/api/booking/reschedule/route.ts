import { NextResponse, type NextRequest } from "next/server";
import { preflight, withCors } from "@/lib/cors";
import { assertSlotBookable } from "@/lib/booking-slots";
import { getByToken, rescheduleBooking } from "@/lib/bookings";
import { updateEvent } from "@/lib/google-calendar";
import { notifyDiscord } from "@/lib/discord";
import { clearReminders } from "@/lib/booking-reminders";
import { sendBookingRescheduleEmail } from "@/lib/email";
import { BOOKING_CONFIG } from "@/lib/booking-config";
import { formatWhen, manageUrl } from "@/lib/booking-format";

export const runtime = "nodejs";

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

  const token = String(body.token || "").trim();
  const slot = String(body.slot || "").trim();
  if (!token || !slot) {
    return withCors(req, NextResponse.json({ ok: false, error: "invalid" }, { status: 400 }));
  }

  const booking = await getByToken(token);
  if (!booking) {
    return withCors(req, NextResponse.json({ ok: false, error: "not_found" }, { status: 404 }));
  }
  if (booking.status === "canceled") {
    return withCors(req, NextResponse.json({ ok: false, error: "canceled" }, { status: 409 }));
  }

  const check = await assertSlotBookable(slot);
  if (!check.ok) {
    const status = check.reason === "invalid" ? 400 : 409;
    return withCors(req, NextResponse.json({ ok: false, error: check.reason }, { status }));
  }
  const startsAt = slot;
  const endsAt = check.endISO!;

  const moved = await rescheduleBooking(booking.id, { starts_at: startsAt, ends_at: endsAt });
  if (!moved.ok) {
    return withCors(req, NextResponse.json({ ok: false, error: "slot_taken" }, { status: 409 }));
  }

  // Re-arm the reminder sequence against the new time: a call moved from next
  // week to tomorrow should still get its 24-hour note.
  await clearReminders(booking.id);

  if (booking.gcal_event_id) {
    try {
      await updateEvent(booking.gcal_event_id, {
        startISO: startsAt,
        endISO: endsAt,
        timeZone: BOOKING_CONFIG.timezone,
      });
    } catch (err) {
      console.error("google calendar reschedule failed", err);
    }
  }

  const whenLabel = formatWhen(startsAt, booking.timezone);
  await sendBookingRescheduleEmail({
    name: booking.name,
    email: booking.email,
    whenLabel,
    meetUrl: booking.meet_url,
    manageUrl: manageUrl(token),
  });

  await notifyDiscord("bookings", {
    title: "🔁 Booking rescheduled",
    fields: [
      { name: "Name", value: booking.name, inline: true },
      { name: "Email", value: booking.email, inline: true },
      { name: "New time", value: whenLabel },
    ],
  });

  return withCors(
    req,
    NextResponse.json({
      ok: true,
      booking: { starts_at: startsAt, ends_at: endsAt, timezone: booking.timezone, meet_url: booking.meet_url },
    }),
  );
}
