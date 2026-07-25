-- 002: Contact form submissions (/api/contact).

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
