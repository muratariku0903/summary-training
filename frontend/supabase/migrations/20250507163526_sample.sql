create table public.sample (
  id           bigserial primary key,
  email        text not null unique,
  full_name    text,
  created_at   timestamptz not null default now()
);
