import { DateTime } from "luxon";
import { BOOKING_CONFIG } from "@/lib/booking-config";

/** Public origin of the static site (where /book and /book/manage live). */
export function siteOrigin(): string {
  return (process.env.BOOKING_SITE_ORIGIN || "https://elenos.ai").replace(/\/$/, "");
}

export function manageUrl(token: string): string {
  return `${siteOrigin()}/book/manage/?token=${encodeURIComponent(token)}`;
}

export function bookUrl(): string {
  return `${siteOrigin()}/book/`;
}

/** Human date/time in a given IANA zone, e.g. "Monday, Aug 4, 2026 · 2:00 PM EDT". */
export function formatWhen(startISO: string, tz?: string | null): string {
  const zone = tz && tz.length > 0 ? tz : BOOKING_CONFIG.timezone;
  const dt = DateTime.fromISO(startISO, { zone: "utc" }).setZone(zone);
  if (!dt.isValid) return startISO;
  return dt.toFormat("cccc, LLL d, yyyy · h:mm a ZZZZ");
}

/** "Add to Google Calendar" template URL. */
export function googleCalendarUrl(opts: {
  startISO: string;
  endISO: string;
  title: string;
  details?: string;
  location?: string;
}): string {
  const fmt = (iso: string) =>
    DateTime.fromISO(iso, { zone: "utc" }).toFormat("yyyyLLdd'T'HHmmss'Z'");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmt(opts.startISO)}/${fmt(opts.endISO)}`,
  });
  if (opts.details) params.set("details", opts.details);
  if (opts.location) params.set("location", opts.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
