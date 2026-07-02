-- Elenos admin: Supabase schema.
-- Run once in the Supabase SQL editor for the project.

create table if not exists events (
  id            bigserial primary key,
  occurred_at   timestamptz not null default now(),
  type          text not null,
  path          text not null,
  referrer      text,
  session_id    text not null,
  ip_hash       text,
  country       text,
  meta          jsonb
);
create index if not exists events_occurred_idx on events (occurred_at desc);
create index if not exists events_type_idx on events (type);
create index if not exists events_session_idx on events (session_id);

create table if not exists contacts (
  id            bigserial primary key,
  created_at    timestamptz not null default now(),
  name          text not null,
  email         text not null,
  company       text,
  project_type  text,
  message       text not null,
  source_path   text,
  status        text not null default 'new'
);
create index if not exists contacts_created_idx on contacts (created_at desc);
create index if not exists contacts_status_idx on contacts (status);

create table if not exists subscribers (
  id            bigserial primary key,
  created_at    timestamptz not null default now(),
  email         text not null unique,
  source_path   text,
  ip_hash       text,
  status        text not null default 'active'   -- active | unsubscribed
);
create index if not exists subscribers_created_idx on subscribers (created_at desc);

-- Funnel leads (/learn): unlock the guide PDF + Discord invite by email.
create table if not exists leads (
  id            bigserial primary key,
  created_at    timestamptz not null default now(),
  name          text not null,
  email         text not null unique,
  source_path   text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  ip_hash       text,
  status        text not null default 'new',      -- new | emailed | email_failed | unsubscribed
  emailed_at    timestamptz
);
create index if not exists leads_created_idx on leads (created_at desc);
create index if not exists leads_utm_source_idx on leads (utm_source);

-- Course purchases (/course): Stripe Checkout via Payment Link.
-- Rows are written by the Stripe webhook (checkout.session.completed).
create table if not exists purchases (
  id                     bigserial primary key,
  created_at             timestamptz not null default now(),
  name                   text,
  email                  text not null,
  product                text not null default 'first-ai-client',
  stripe_session_id      text not null unique,
  stripe_payment_intent  text,
  amount_cents           integer,
  currency               text,
  status                 text not null default 'paid',  -- paid | delivered | delivery_failed | refunded
  delivered_at           timestamptz
);
create index if not exists purchases_created_idx on purchases (created_at desc);
create index if not exists purchases_email_idx on purchases (email);

-- Client portal: clients, tickets, threaded messages.
-- Clients log in via Supabase Auth; one row per auth user.

create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references auth.users(id) on delete cascade,
  name          text not null,
  company       text,
  email         text not null,
  status        text not null default 'active',  -- active | archived
  created_at    timestamptz not null default now()
);
create index if not exists clients_user_id_idx on clients (user_id);
create index if not exists clients_status_idx on clients (status);

create table if not exists tickets (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients(id) on delete cascade,
  title         text not null,
  priority      text not null default 'normal',  -- low | normal | high | urgent
  status        text not null default 'open',    -- open | in_progress | waiting_client | resolved | closed
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists tickets_client_id_idx on tickets (client_id);
create index if not exists tickets_status_idx on tickets (status);
create index if not exists tickets_updated_idx on tickets (updated_at desc);

create table if not exists ticket_messages (
  id              uuid primary key default gen_random_uuid(),
  ticket_id       uuid not null references tickets(id) on delete cascade,
  author_type     text not null,  -- client | admin
  author_user_id  uuid references auth.users(id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index if not exists ticket_messages_ticket_id_idx on ticket_messages (ticket_id, created_at);

-- Bump tickets.updated_at whenever a new message lands so the list view sorts correctly.
create or replace function bump_ticket_updated_at()
returns trigger language plpgsql as $$
begin
  update tickets set updated_at = now() where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists ticket_messages_bump on ticket_messages;
create trigger ticket_messages_bump
  after insert on ticket_messages
  for each row execute function bump_ticket_updated_at();

-- Row-Level Security: clients see only their own data.
-- The service-role key used by API routes bypasses RLS, so admin queries are unaffected.

alter table clients          enable row level security;
alter table tickets          enable row level security;
alter table ticket_messages  enable row level security;

drop policy if exists "clients read own profile" on clients;
create policy "clients read own profile" on clients
  for select using (user_id = auth.uid());

drop policy if exists "clients read own tickets" on tickets;
create policy "clients read own tickets" on tickets
  for select using (
    client_id in (select id from clients where user_id = auth.uid())
  );

drop policy if exists "clients insert own tickets" on tickets;
create policy "clients insert own tickets" on tickets
  for insert with check (
    client_id in (select id from clients where user_id = auth.uid())
  );

drop policy if exists "clients read own messages" on ticket_messages;
create policy "clients read own messages" on ticket_messages
  for select using (
    ticket_id in (
      select t.id from tickets t
      join clients c on c.id = t.client_id
      where c.user_id = auth.uid()
    )
  );

drop policy if exists "clients insert own messages" on ticket_messages;
create policy "clients insert own messages" on ticket_messages
  for insert with check (
    author_type = 'client'
    and author_user_id = auth.uid()
    and ticket_id in (
      select t.id from tickets t
      join clients c on c.id = t.client_id
      where c.user_id = auth.uid()
    )
  );
