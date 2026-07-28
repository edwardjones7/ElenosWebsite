import "server-only";
import { getSupabase } from "@/lib/supabase";

export type BookingStatus = "confirmed" | "canceled";

export type Booking = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  company: string | null;
  message: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string | null;
  status: BookingStatus;
  meet_url: string | null;
  gcal_event_id: string | null;
  manage_token: string;
  source_path: string | null;
  ip_hash: string | null;
};

export type NewBooking = {
  name: string;
  email: string;
  company: string | null;
  message: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string | null;
  manage_token: string;
  source_path: string | null;
  ip_hash: string | null;
};

/** Confirmed bookings overlapping [fromISO, toISO). Used by the slot engine to
 *  block already-taken times. */
export async function listConfirmedBetween(
  fromISO: string,
  toISO: string,
): Promise<Pick<Booking, "starts_at" | "ends_at">[]> {
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("starts_at, ends_at")
    .eq("status", "confirmed")
    .gte("starts_at", fromISO)
    .lt("starts_at", toISO);
  if (error) throw error;
  return (data || []) as Pick<Booking, "starts_at" | "ends_at">[];
}

/** Confirmed bookings in a range, with the fields the calendar reconcile needs:
 *  id + created_at (grace) + start/end + event id. */
export async function listConfirmedForReconcile(
  fromISO: string,
  toISO: string,
): Promise<Pick<Booking, "id" | "created_at" | "starts_at" | "ends_at" | "gcal_event_id">[]> {
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("id, created_at, starts_at, ends_at, gcal_event_id")
    .eq("status", "confirmed")
    .gte("starts_at", fromISO)
    .lt("starts_at", toISO);
  if (error) throw error;
  return (data || []) as Pick<
    Booking,
    "id" | "created_at" | "starts_at" | "ends_at" | "gcal_event_id"
  >[];
}

/** Inserts a confirmed booking. The partial unique index on (starts_at) where
 *  status='confirmed' is the authoritative double-booking guard: a race that
 *  hits the same slot fails with Postgres 23505 → { slotTaken: true }. */
export async function createBooking(
  b: NewBooking,
): Promise<{ booking?: Booking; slotTaken?: boolean }> {
  const { data, error } = await getSupabase()
    .from("bookings")
    .insert({ ...b, status: "confirmed" })
    .select("*")
    .single();
  if (error) {
    if ((error as { code?: string }).code === "23505") return { slotTaken: true };
    throw error;
  }
  return { booking: data as Booking };
}

/** Stores the Google Calendar event id + Meet link after event creation. */
export async function setBookingEvent(
  id: string,
  fields: { meet_url: string | null; gcal_event_id: string | null },
): Promise<void> {
  const { error } = await getSupabase().from("bookings").update(fields).eq("id", id);
  if (error) throw error;
}

export async function getByToken(token: string): Promise<Booking | null> {
  if (!token) return null;
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("*")
    .eq("manage_token", token)
    .maybeSingle();
  if (error) throw error;
  return (data as Booking) || null;
}

export async function getById(id: string): Promise<Booking | null> {
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Booking) || null;
}

export async function cancelBooking(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("bookings")
    .update({ status: "canceled" })
    .eq("id", id);
  if (error) throw error;
}

/** Moves a confirmed booking to a new time. Returns false on a slot collision
 *  (the unique index rejecting the new start). */
export async function rescheduleBooking(
  id: string,
  fields: { starts_at: string; ends_at: string },
): Promise<{ ok: boolean; slotTaken?: boolean }> {
  const { error } = await getSupabase().from("bookings").update(fields).eq("id", id);
  if (error) {
    if ((error as { code?: string }).code === "23505") return { ok: false, slotTaken: true };
    throw error;
  }
  return { ok: true };
}

export type BookingFilter = "upcoming" | "past" | "canceled" | "all";

/** Admin list. Upcoming = confirmed & future; past = confirmed & elapsed. */
export async function listBookings(filter: BookingFilter = "upcoming"): Promise<Booking[]> {
  const nowIso = new Date().toISOString();
  let q = getSupabase().from("bookings").select("*");

  if (filter === "canceled") {
    q = q.eq("status", "canceled").order("starts_at", { ascending: false });
  } else if (filter === "past") {
    q = q.eq("status", "confirmed").lt("starts_at", nowIso).order("starts_at", { ascending: false });
  } else if (filter === "upcoming") {
    q = q.eq("status", "confirmed").gte("starts_at", nowIso).order("starts_at", { ascending: true });
  } else {
    q = q.order("starts_at", { ascending: false });
  }

  const { data, error } = await q.limit(500);
  if (error) throw error;
  return (data || []) as Booking[];
}
