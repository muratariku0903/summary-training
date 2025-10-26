-- LLMs table
-- 目的: 利用可能なLLMカタログ（ベンダ名とモデル名）。秘密情報は保存しない。

-- 共通: updated_at を自動更新するトリガ関数（他テーブルでも使えます）
create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

-- 1) ベンダ enum
do $$ begin
  create type llm_vendor as enum ('openai','google','anthropic');
exception when duplicate_object then null; end $$;

-- テーブル本体
create table if not exists public.llms (
  id         uuid primary key default gen_random_uuid(),
  vendor     llm_vendor not null,         -- 例: 'openai'
  model      text not null,               -- 例: 'gpt-4o-mini'（モデル識別子）
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  meta       jsonb not null default '{}'::jsonb  -- 任意メタ（備考・表示名など）
);

-- updated_at 自動更新トリガ
drop trigger if exists trg_llms_updated_at on public.llms;
create trigger trg_llms_updated_at
  before update on public.llms
  for each row execute function public.trigger_set_timestamp();

-- RLS 有効化
alter table public.llms enable row level security;

-- 念のため、匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.llms from anon;
revoke all on table public.llms from authenticated;
