-- 01_create_seed_generator_categories.sql
create extension if not exists pgcrypto;

create or replace function public.trigger_set_timestamp()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table if not exists public.seed_generator_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  -- 将来階層化したい場合
  parent_id    uuid references public.seed_generator_categories(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_sgc_updated_at on public.seed_generator_categories;
create trigger trg_sgc_updated_at
  before update on public.seed_generator_categories
  for each row execute function public.trigger_set_timestamp();

-- RLS 有効化
alter table public.seed_generator_categories enable row level security;

-- 匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.seed_generator_categories from anon;
revoke all on table public.seed_generator_categories from authenticated;
