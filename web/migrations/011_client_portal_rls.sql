-- 011: Row-Level Security — clients see only their own data.
-- Depends on 008_clients.sql, 009_tickets.sql, 010_ticket_messages.sql.
--
-- The service-role key used by API routes bypasses RLS, so admin queries are
-- unaffected. Re-runnable: every policy is dropped before being recreated.

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
