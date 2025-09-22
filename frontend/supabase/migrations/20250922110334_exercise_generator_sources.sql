-- UUID 生成拡張（既に有効ならスキップ）
create extension if not exists pgcrypto;

-- updated_at 自動更新トリガ関数（共通で使い回し可）
create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

create table if not exists public.exercise_generator_sources (
  id                   uuid primary key default gen_random_uuid(),

  title                text,
  description          text,
  is_active            boolean not null default true,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- updated_at 自動更新トリガ
drop trigger if exists trg_exercise_generator_sources_updated_at on public.exercise_generator_sources;
create trigger trg_exercise_generator_sources_updated_at
  before update on public.exercise_generator_sources
  for each row execute function public.trigger_set_timestamp();


-- RLS 有効化
alter table public.exercise_generator_sources enable row level security;

-- 念のため、匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.exercise_generator_sources from anon;
revoke all on table public.exercise_generator_sources from authenticated;
