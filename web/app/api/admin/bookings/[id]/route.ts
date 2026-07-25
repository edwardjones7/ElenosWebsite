import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getById, cancelBooking } from "@/lib/bookings";
import { deleteEvent } from "@/lib/google-calendar";
import { notifyDiscord } from "@/lib/discord";
import { sendBookingCancelEmail } from "@/lib/email";
import { bookUrl, formatWhen } from "@/lib/booking-format";

export const runtime = "nodejs";

/** Cancel a booking from the admin: frees the slot, removes the Google Calendar
 *  event, and emails the booker a cancellation notice. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const blocked = await requireAdmin(req);
  if (blocked) return blocked;

  const id = params.id;
  if (!id) return NextResponse.json({ error: "bad_id" }, { status: 400 });

  let booking;
  try {
    booking = await getById(id);
  } catch (e) {
    return NextResponse.json({ error: "db", message: (e as Error).message }, { status: 500 });
  }
  if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (booking.status === "canceled") return NextResponse.json({ ok: true, already: true });

  if (booking.gcal_event_id) {
    try {
      await deleteEvent(booking.gcal_event_id);
    } catch (err) {
      console.error("google calendar cancel failed", err);
    }
  }

  try {
    await cancelBooking(booking.id);
  } catch (e) {
    return NextResponse.json({ error: "db", message: (e as Error).message }, { status: 500 });
  }

  await sendBookingCancelEmail({ name: booking.name, email: booking.email, rebookUrl: bookUrl() });
  await notifyDiscord("bookings", {
    title: "❌ Booking canceled (admin)",
    fields: [
      { name: "Name", value: booking.name, inline: true },
      { name: "Email", value: booking.email, inline: true },
      { name: "Was", value: formatWhen(booking.starts_at, booking.timezone) },
    ],
  });

  return NextResponse.json({ ok: true });
}
