-- 目的: seed生成方針のプロファイル（ai_theme / youtube_channels など）

-- UUID
create extension if not exists pgcrypto;

-- プロファイル種別
do $$ begin
  create type seed_profile_type as enum ('ai_theme','youtube_channels','web','storage');
exception when duplicate_object then null; end $$;

-- updated_at 自動更新
create or replace function public.trigger_set_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

-- 本体
create table if not exists public.seed_generator_profiles (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text,

  profile_type     seed_profile_type not null,       -- 'ai_theme' | 'youtube_channels' | ...
  is_active        boolean not null default true,

  -- プロファイル固有設定（型ごとの期待例は下のコメント参照）
  config           jsonb not null default '{}'::jsonb,
  -- 例: ai_theme
  -- { "llm_id":"<uuid or vendor+model>", "min_chars":800, "max_chars":1500,
  --   "prompt_system":"...", "prompt_user":"..." }
  -- 例: youtube_channels
  -- { "min_duration_sec":180, "allow_shorts":false, "text_provider":"notebooklm|captions|asr" }

  meta             jsonb not null default '{}'::jsonb,  -- 補助メタ（自由）
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- インデックス
create index if not exists idx_sgp_active on public.seed_generator_profiles(is_active);
create index if not exists idx_sgp_type   on public.seed_generator_profiles(profile_type);

-- updated_at トリガ
drop trigger if exists trg_sgp_updated_at on public.seed_generator_profiles;
create trigger trg_sgp_updated_at
  before update on public.seed_generator_profiles
  for each row execute function public.trigger_set_timestamp();


-- RLS 有効化
alter table public.llms enable row level security;

-- 念のため、匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.llms from anon;
revoke all on table public.llms from authenticated;
