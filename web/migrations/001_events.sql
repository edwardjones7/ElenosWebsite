-- 001: Pageview / event tracking (/api/e).

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
