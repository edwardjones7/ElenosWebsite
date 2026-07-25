import "server-only";
import { DateTime } from "luxon";
import { BOOKING_CONFIG, DAY_KEYS, type Window } from "@/lib/booking-config";
import { getBusy, googleConfigured, type BusyInterval } from "@/lib/google-calendar";
import { listConfirmedBetween } from "@/lib/bookings";

const { timezone, slotMinutes, weeklyHours, minNoticeHours, horizonDays, bufferMinutes } =
  BOOKING_CONFIG;

export type SlotsResult = {
  slots: string[]; // UTC ISO start instants, ascending
  timezone: string; // owner tz (informational)
  slotMinutes: number;
};

/** luxon weekday is 1=Mon..7=Sun; DAY_KEYS is [sun..sat] at index 0..6. */
function dayKeyFor(dt: DateTime) {
  return DAY_KEYS[dt.weekday % 7];
}

function parseHHmm(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return { hour: h || 0, minute: m || 0 };
}

/** Every candidate slot start (as UTC DateTime) permitted by the weekly rules
 *  between two owner-tz day boundaries, before busy/booked subtraction. */
function candidateStarts(rangeStart: DateTime, rangeEnd: DateTime): DateTime[] {
  const out: DateTime[] = [];
  let day = rangeStart.setZone(timezone).startOf("day");
  const lastDay = rangeEnd.setZone(timezone).endOf("day");

  while (day <= lastDay) {
    const windows: Window[] = weeklyHours[dayKeyFor(day)] || [];
    for (const [open, close] of windows) {
      const o = parseHHmm(open);
      const c = parseHHmm(close);
      const openDT = day.set({ hour: o.hour, minute: o.minute, second: 0, millisecond: 0 });
      const closeDT = day.set({ hour: c.hour, minute: c.minute, second: 0, millisecond: 0 });
      let s = openDT;
      while (s.plus({ minutes: slotMinutes }) <= closeDT) {
        out.push(s.toUTC());
        s = s.plus({ minutes: slotMinutes });
      }
    }
    day = day.plus({ days: 1 });
  }
  return out;
}

/** Expand a busy interval by the configured buffer, in millis. */
function busyToMillis(busy: BusyInterval[]): { start: number; end: number }[] {
  const buf = bufferMinutes * 60_000;
  return busy
    .map((b) => ({
      start: DateTime.fromISO(b.start, { zone: "utc" }),
      end: DateTime.fromISO(b.end, { zone: "utc" }),
    }))
    .filter((b) => b.start.isValid && b.end.isValid)
    .map((b) => ({ start: b.start.toMillis() - buf, end: b.end.toMillis() + buf }));
}

function overlapsAny(startMs: number, endMs: number, blocks: { start: number; end: number }[]) {
  return blocks.some((b) => startMs < b.end && endMs > b.start);
}

/** Available slots between fromISO and toISO, clamped to notice/horizon and with
 *  Google-busy and existing confirmed bookings removed. */
export async function getAvailableSlots(fromISO: string, toISO: string): Promise<SlotsResult> {
  const now = DateTime.utc();
  const earliest = now.plus({ hours: minNoticeHours });
  const horizonEnd = now.plus({ days: horizonDays });

  let rangeStart = DateTime.fromISO(fromISO, { zone: "utc" });
  let rangeEnd = DateTime.fromISO(toISO, { zone: "utc" });
  if (!rangeStart.isValid || !rangeEnd.isValid) {
    return { slots: [], timezone, slotMinutes };
  }
  if (rangeStart < earliest) rangeStart = earliest;
  if (rangeEnd > horizonEnd) rangeEnd = horizonEnd;
  if (rangeEnd <= rangeStart) return { slots: [], timezone, slotMinutes };

  const candidates = candidateStarts(rangeStart, rangeEnd).filter(
    (s) => s >= rangeStart && s < rangeEnd && s >= earliest,
  );
  if (candidates.length === 0) return { slots: [], timezone, slotMinutes };

  // Blocking intervals: Google busy (if configured) + existing confirmed bookings.
  const blocks: { start: number; end: number }[] = [];
  if (googleConfigured()) {
    const busy = await getBusy(rangeStart.toISO()!, rangeEnd.toISO()!);
    blocks.push(...busyToMillis(busy));
  }
  const booked = await listConfirmedBetween(rangeStart.toISO()!, rangeEnd.toISO()!);
  blocks.push(
    ...booked
      .map((b) => ({
        start: DateTime.fromISO(b.starts_at, { zone: "utc" }),
        end: DateTime.fromISO(b.ends_at, { zone: "utc" }),
      }))
      .filter((b) => b.start.isValid && b.end.isValid)
      .map((b) => ({ start: b.start.toMillis(), end: b.end.toMillis() })),
  );

  const slotMs = slotMinutes * 60_000;
  const slots = candidates
    .filter((s) => !overlapsAny(s.toMillis(), s.toMillis() + slotMs, blocks))
    .map((s) => s.toISO()!)
    .filter(Boolean);

  return { slots, timezone, slotMinutes };
}

export type BookableCheck = { ok: boolean; reason?: "invalid" | "unavailable"; endISO?: string };

/** Validate that a specific start instant is a bookable slot right now:
 *  aligned to the rules, inside notice/horizon, and free of busy/bookings.
 *  Used by create + reschedule to re-check at commit time. */
export async function assertSlotBookable(startISO: string): Promise<BookableCheck> {
  const start = DateTime.fromISO(startISO, { zone: "utc" });
  if (!start.isValid) return { ok: false, reason: "invalid" };

  const end = start.plus({ minutes: slotMinutes });
  // Regenerate that day's candidates and require an exact match (alignment + rules + notice/horizon).
  const dayFrom = start.minus({ minutes: 1 });
  const dayTo = end.plus({ minutes: 1 });
  const { slots } = await getAvailableSlots(dayFrom.toISO()!, dayTo.toISO()!);
  const startMs = start.toMillis();
  const ok = slots.some((iso) => DateTime.fromISO(iso, { zone: "utc" }).toMillis() === startMs);
  return ok ? { ok: true, endISO: end.toUTC().toISO()! } : { ok: false, reason: "unavailable" };
}

/** Owner-tz label for an instant, e.g. "Mon, Aug 4 · 2:00 PM EDT". */
export function slotLabel(startISO: string, tz: string = timezone): string {
  const dt = DateTime.fromISO(startISO, { zone: "utc" }).setZone(tz);
  return dt.toFormat("cccc, LLL d · h:mm a ZZZZ");
}
