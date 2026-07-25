-- 005: Course purchases (/course) — Stripe Checkout via Payment Link.
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
