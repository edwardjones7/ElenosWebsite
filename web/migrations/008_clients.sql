-- 008: Client portal — clients.
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
