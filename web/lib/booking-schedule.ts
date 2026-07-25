/** When each pre-call reminder fires. Pure date math, no I/O — the DB side of
 *  the sequence lives in booking-reminders.ts. */

/** The pre-call sequence. The booking confirmation itself is sent inline by
 *  /api/booking — these are the four scheduled follow-ups. */
export type ReminderKind = "3d" | "24h" | "20m" | "start";

export const REMINDER_KINDS: ReminderKind[] = ["3d", "24h", "20m", "start"];

/** Minutes before starts_at that each reminder fires. */
const OFFSET_MINUTES: Record<ReminderKind, number> = {
  "3d": 72 * 60,
  "24h": 24 * 60,
  "20m": 20,
  start: 0,
};

/** How late a reminder may still go out if the cron missed its window (minutes).
 *  Each cap is well under the gap to the next milestone, so a backlog can never
 *  make two reminders land together. Past the cap the reminder is simply skipped. */
const LATE_CAP_MINUTES: Record<ReminderKind, number> = {
  "3d": 12 * 60,
  "24h": 6 * 60,
  "20m": 10,
  start: 20,
};

/** Widest window the cron needs to scan: far enough ahead to catch a 3-day
 *  reminder, far enough back to catch a late "starting now". */
export const SCAN_AHEAD_MINUTES = 73 * 60;
export const SCAN_BEHIND_MINUTES = LATE_CAP_MINUTES.start + 10;

const MIN = 60_000;

/** Reminders that should go out for this booking right now.
 *
 *  A reminder is due when its moment has arrived, hasn't been missed by more
 *  than its late cap, and — crucially — was still in the future when the
 *  booking was made. That last test is what makes "3 days before" apply only
 *  when the call was actually booked more than 3 days out: book on Tuesday for
 *  Thursday and the 3-day milestone is already behind you, so it never fires. */
export function dueKinds(
  booking: { starts_at: string; created_at: string },
  now: Date,
): ReminderKind[] {
  const startMs = Date.parse(booking.starts_at);
  const createdMs = Date.parse(booking.created_at);
  if (!Number.isFinite(startMs) || !Number.isFinite(createdMs)) return [];
  const nowMs = now.getTime();

  return REMINDER_KINDS.filter((kind) => {
    const sendMs = startMs - OFFSET_MINUTES[kind] * MIN;
    if (sendMs < createdMs) return false; // milestone already passed at booking time
    if (nowMs < sendMs) return false; // not yet
    if (nowMs > sendMs + LATE_CAP_MINUTES[kind] * MIN) return false; // missed it
    if (kind !== "start" && nowMs >= startMs) return false; // never a "before" note after the call starts
    return true;
  });
}
