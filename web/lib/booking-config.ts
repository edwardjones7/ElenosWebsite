/** Booking availability rules for the /book discovery-call scheduler.
 *
 *  MVP: availability lives here as code constants. A future admin UI can move
 *  these into a `booking_settings` table without changing the slot engine.
 *
 *  All times in WEEKLY_HOURS are wall-clock in TIMEZONE (the owner's zone).
 *  The slot engine (booking-slots.ts) converts them to UTC per-day so DST is
 *  handled correctly. */

export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

/** [openHHmm, closeHHmm] windows per weekday. Empty array = no availability. */
export type Window = [string, string];

export const BOOKING_CONFIG = {
  /** Owner timezone — IANA name. Slots are generated against this zone. */
  timezone: "America/New_York",

  /** Meeting length in minutes. Single event type (discovery call). */
  slotMinutes: 30,

  /** Weekly working hours, in the owner timezone. */
  weeklyHours: {
    sun: [] as Window[],
    mon: [["10:00", "16:00"]] as Window[],
    tue: [["10:00", "16:00"]] as Window[],
    wed: [["10:00", "16:00"]] as Window[],
    thu: [["10:00", "16:00"]] as Window[],
    fri: [["10:00", "15:00"]] as Window[],
    sat: [] as Window[],
  } as Record<DayKey, Window[]>,

  /** Minimum lead time — no bookings sooner than this many hours from now. */
  minNoticeHours: 4,

  /** How far ahead bookings are offered. */
  horizonDays: 21,

  /** Padding (minutes) kept clear on either side of an existing meeting. */
  bufferMinutes: 0,
} as const;

export const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
