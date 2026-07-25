import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  bookingsToScan,
  claimReminder,
  dueKinds,
  releaseReminder,
  type ReminderKind,
} from "@/lib/booking-reminders";
import { sendBookingReminderEmail } from "@/lib/email";
import { formatWhen, manageUrl } from "@/lib/booking-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Any other scheduler
 *  can send the same header. Without CRON_SECRET set the route refuses to run
 *  rather than sitting open — an unauthenticated caller could otherwise drain
 *  the send quota by hammering it. */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let scanned = 0;
  let sent = 0;
  let failed = 0;
  const detail: { kind: ReminderKind; email: string; ok: boolean }[] = [];

  try {
    const bookings = await bookingsToScan(now);
    scanned = bookings.length;

    for (const booking of bookings) {
      for (const kind of dueKinds(booking, now)) {
        // Claim before sending so a retry or an overlapping run can't double-send.
        if (!(await claimReminder(booking.id, kind))) continue;

        const res = await sendBookingReminderEmail({
          kind,
          name: booking.name,
          email: booking.email,
          whenLabel: formatWhen(booking.starts_at, booking.timezone),
          meetUrl: booking.meet_url,
          manageUrl: manageUrl(booking.manage_token),
        });

        if (res.sent) {
          sent++;
        } else {
          // Hand the claim back so the next run retries, while the late cap allows.
          failed++;
          await releaseReminder(booking.id, kind);
        }
        detail.push({ kind, email: booking.email, ok: res.sent });
      }
    }
  } catch (err) {
    console.error("booking reminder cron failed", err);
    return NextResponse.json({ ok: false, error: "cron_failed", scanned, sent, failed }, { status: 500 });
  }

  return NextResponse.json({ ok: true, scanned, sent, failed, detail });
}
