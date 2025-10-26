create extension if not exists pgcrypto;

create table if not exists public.exercise_generator_profile_sources (
  profile_id    uuid not null references public.exercise_generator_profiles(id) on delete cascade,
  source_id     uuid not null references public.exercise_generator_sources(id) on delete cascade,
  primary key (profile_id, source_id)
);

-- RLS 有効化
alter table public.exercise_generator_profile_sources enable row level security;

-- 匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.exercise_generator_profile_sources from anon;
revoke all on table public.exercise_generator_profile_sources from authenticated;
