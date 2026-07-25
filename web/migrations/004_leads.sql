-- 004: Funnel leads (/learn) — unlock the guide PDF + Discord invite by email.

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
