-- 003: Newsletter subscribers (/api/subscribe, /api/unsubscribe).

create table if not exists subscribers (
  id            bigserial primary key,
  created_at    timestamptz not null default now(),
  email         text not null unique,
  source_path   text,
  ip_hash       text,
  status        text not null default 'active'   -- active | unsubscribed
);
create index if not exists subscribers_created_idx on subscribers (created_at desc);
