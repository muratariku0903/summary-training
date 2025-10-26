create extension if not exists pgcrypto;

create table if not exists public.exercise_generator_source_seeds (
  source_id     uuid not null references public.exercise_generator_sources(id) on delete cascade,
  seed_id       uuid not null references public.exercise_generator_seeds(id) on delete cascade,
  primary key (source_id, seed_id)
);

create index if not exists idx_egss_source on public.exercise_generator_source_seeds(source_id);

-- RLS 有効化
alter table public.exercise_generator_source_seeds enable row level security;

-- 匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.exercise_generator_source_seeds from anon;
revoke all on table public.exercise_generator_source_seeds from authenticated;
