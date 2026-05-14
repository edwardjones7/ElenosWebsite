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
