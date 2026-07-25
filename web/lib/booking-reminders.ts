import "server-only";
import { getSupabase } from "@/lib/supabase";
import type { Booking } from "@/lib/bookings";
import { SCAN_AHEAD_MINUTES, SCAN_BEHIND_MINUTES, type ReminderKind } from "@/lib/booking-schedule";

export { dueKinds, REMINDER_KINDS, type ReminderKind } from "@/lib/booking-schedule";

const MIN = 60_000;

/** Confirmed bookings whose start time falls in the cron's scan window. */
export async function bookingsToScan(now: Date): Promise<Booking[]> {
  const from = new Date(now.getTime() - SCAN_BEHIND_MINUTES * MIN).toISOString();
  const to = new Date(now.getTime() + SCAN_AHEAD_MINUTES * MIN).toISOString();
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("*")
    .eq("status", "confirmed")
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data || []) as Booking[];
}

/** Reserves the right to send one reminder. Returns false when the row already
 *  exists — i.e. it's been sent, or another cron run claimed it a moment ago.
 *  Claim first, send second: a duplicate reminder is worse than a missed one. */
export async function claimReminder(bookingId: string, kind: ReminderKind): Promise<boolean> {
  const { error } = await getSupabase()
    .from("booking_reminders")
    .insert({ booking_id: bookingId, kind });
  if (error) {
    if ((error as { code?: string }).code === "23505") return false;
    throw error;
  }
  return true;
}

/** Releases a claim after a failed send so the next run can retry it, as long
 *  as the reminder is still inside its late cap. */
export async function releaseReminder(bookingId: string, kind: ReminderKind): Promise<void> {
  const { error } = await getSupabase()
    .from("booking_reminders")
    .delete()
    .eq("booking_id", bookingId)
    .eq("kind", kind);
  if (error) console.error("release reminder failed", bookingId, kind, error);
}

/** Wipes the ledger for a booking so the sequence re-arms against a new time.
 *  Called on reschedule — someone who moves from next week to tomorrow should
 *  still get the 24-hour note even though the 3-day one already went out. */
export async function clearReminders(bookingId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("booking_reminders")
    .delete()
    .eq("booking_id", bookingId);
  if (error) console.error("clear reminders failed", bookingId, error);
}
