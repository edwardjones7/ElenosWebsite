-- 010: Client portal — threaded ticket messages.
-- Depends on 009_tickets.sql.

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
