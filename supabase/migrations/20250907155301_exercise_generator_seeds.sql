-- 02_create_exercise_generator_seeds.sql
-- 種データ本体（生成元プロファイルFK＋由来情報。assetテーブルは使いません）

-- UUID 生成拡張（既に有効ならスキップ）
create extension if not exists pgcrypto;

-- 必要な enum（存在時はスキップ）
do $$ begin
  create type seed_status as enum ('active','paused','archived');
exception when duplicate_object then null; end $$;

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

-- 本体
create table if not exists public.exercise_generator_seeds (
  id                   uuid primary key default gen_random_uuid(),

  -- どの seed_generator_profile（= ai_theme / youtube_channels 等）から生成されたか
  generator_profile_id uuid not null
    references public.seed_generator_profiles(id)
    on delete restrict,

  status               seed_status not null default 'active',
  locale               text default 'ja-JP',

  title                text,
  summary              text,
  raw_text             text,                           -- LLM入力用の正規化本文（抽出/ASR後）
  meta                 jsonb not null default '{}'::jsonb,  -- {source_url, license, author ...}

  -- 冪等化/重複排除
  idempotency_key      text,                           -- 外部IDや (profile+外部ID) 等
  fingerprint_sha256   text,                           -- 正規化本文のハッシュなど

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- インデックス
create index if not exists idx_egs_generator_profile
  on public.exercise_generator_seeds (generator_profile_id);

-- updated_at 自動更新トリガ
drop trigger if exists trg_egs_seeds_updated_at on public.exercise_generator_seeds;
create trigger trg_egs_seeds_updated_at
  before update on public.exercise_generator_seeds
  for each row execute function public.trigger_set_timestamp();


-- RLS 有効化
alter table public.exercise_generator_seeds enable row level security;

-- 念のため、匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.exercise_generator_seeds from anon;
revoke all on table public.exercise_generator_seeds from authenticated;
