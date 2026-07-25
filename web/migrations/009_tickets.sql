-- 009: Client portal — tickets.
-- Depends on 008_clients.sql.

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
