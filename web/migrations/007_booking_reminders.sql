-- 007: Reminder ledger for the pre-call email sequence (3d / 24h / 20m / start).
-- Depends on 006_bookings.sql.
--
-- One row per (booking, kind); the unique index is what makes the cron
-- idempotent — a concurrent or retried run hits 23505 and skips the send.
-- Rows are deleted on reschedule so the sequence re-arms against the new time.

create table if not exists booking_reminders (
  id          bigserial primary key,
  booking_id  uuid not null references bookings(id) on delete cascade,
  kind        text not null,                        -- 3d | 24h | 20m | start
  sent_at     timestamptz not null default now()
);
create unique index if not exists booking_reminders_once_idx
  on booking_reminders (booking_id, kind);
