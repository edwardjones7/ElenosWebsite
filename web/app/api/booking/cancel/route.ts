import { NextResponse, type NextRequest } from "next/server";
import { preflight, withCors } from "@/lib/cors";
import { getByToken, cancelBooking } from "@/lib/bookings";
import { deleteEvent } from "@/lib/google-calendar";
import { notifyDiscord } from "@/lib/discord";
import { sendBookingCancelEmail } from "@/lib/email";
import { bookUrl, formatWhen } from "@/lib/booking-format";

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
  if (!token) {
    return withCors(req, NextResponse.json({ ok: false, error: "invalid" }, { status: 400 }));
  }

  const booking = await getByToken(token);
  if (!booking) {
    return withCors(req, NextResponse.json({ ok: false, error: "not_found" }, { status: 404 }));
  }
  // Idempotent: already canceled → succeed without side effects.
  if (booking.status === "canceled") {
    return withCors(req, NextResponse.json({ ok: true, already: true }));
  }

  if (booking.gcal_event_id) {
    try {
      await deleteEvent(booking.gcal_event_id);
    } catch (err) {
      console.error("google calendar cancel failed", err);
    }
  }

  await cancelBooking(booking.id);

  await sendBookingCancelEmail({ name: booking.name, email: booking.email, rebookUrl: bookUrl() });

  await notifyDiscord("bookings", {
    title: "❌ Booking canceled",
    fields: [
      { name: "Name", value: booking.name, inline: true },
      { name: "Email", value: booking.email, inline: true },
      { name: "Was", value: formatWhen(booking.starts_at, booking.timezone) },
    ],
  });

  return withCors(req, NextResponse.json({ ok: true }));
}
