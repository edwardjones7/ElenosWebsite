# Supabase migrations

Run these in the Supabase SQL editor **in filename order** — later files depend
on earlier ones (`booking_reminders` → `bookings`, `tickets` → `clients`, RLS →
all three portal tables).

Every file is idempotent (`create table if not exists`, `create or replace`,
`drop policy if exists` before each `create policy`), so re-running one is safe
and re-running the whole set on an existing database is a no-op.

| File | What it adds |
| --- | --- |
| `001_events.sql` | Pageview / event tracking (`/api/e`) |
| `002_contacts.sql` | Contact form submissions |
| `003_subscribers.sql` | Newsletter subscribers |
| `004_leads.sql` | `/learn` funnel leads |
| `005_purchases.sql` | Stripe course purchases |
| `006_bookings.sql` | `/book` discovery-call scheduler |
| `007_booking_reminders.sql` | Ledger for the pre-call reminder sequence |
| `008_clients.sql` | Client portal — clients |
| `009_tickets.sql` | Client portal — tickets |
| `010_ticket_messages.sql` | Client portal — messages + `updated_at` trigger |
| `011_client_portal_rls.sql` | Row-Level Security policies for the portal |

## Adding a migration

New file, next number, forward-only — don't edit a file that's already been run
against production. Anything that isn't naturally idempotent needs a guard so
re-running the directory top to bottom stays safe.
