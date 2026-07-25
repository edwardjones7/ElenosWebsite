-- 006: Bookings (/book) — custom discovery-call scheduler (Calendly replacement).
-- Rows are written by /api/booking; each confirmed booking also creates a
-- Google Calendar event (with a Meet link). Service-role only, no RLS.

create table if not exists bookings (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  email         text not null,
  company       text,
  message       text,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  timezone      text,                                 -- visitor tz, for display
  status        text not null default 'confirmed',    -- confirmed | canceled
  meet_url      text,
  gcal_event_id text,
  manage_token  text not null,                        -- opaque random, for reschedule/cancel
  source_path   text,
  ip_hash       text
);
create index if not exists bookings_starts_idx on bookings (starts_at);
create index if not exists bookings_status_idx on bookings (status);
create index if not exists bookings_token_idx  on bookings (manage_token);
-- Race-safe double-booking guard: only one confirmed booking per start time.
create unique index if not exists bookings_slot_active_idx
  on bookings (starts_at) where status = 'confirmed';
