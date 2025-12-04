-- 評価ステータス enum（なければ作成）
do $$ begin
  create type public.exercise_evaluation_status as enum ('queued','processing','succeeded','failed');
exception when duplicate_object then null; end $$;

create table if not exists public.exercise_evaluations (
  id uuid primary key default gen_random_uuid(),               -- PK
  submission_id uuid not null,                                 -- FK -> exercise_submissions.id
  status public.exercise_evaluation_status not null default 'queued',
  score numeric,                                               -- 数値
  feedback jsonb,                                              -- JSON
  evaluated_vendor public.llm_vendor,                          -- 既存 enum
  evaluated_model text,                                        -- 文字列
  rubrics_version integer,                                     -- 数値
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_evaluations_submission_id_fkey
    foreign key (submission_id) references public.exercise_submissions(id)
    on delete cascade
);

-- よく使う参照カラムにインデックス
create index if not exists exercise_evaluations_submission_id_idx on public.exercise_evaluations (submission_id);
create index if not exists exercise_evaluations_status_idx on public.exercise_evaluations (status);

-- updated_at 自動更新トリガ
drop trigger if exists trg_exercise_evaluations_updated_at on public.exercise_evaluations;
create trigger trg_exercise_evaluations_updated_at
  before update on public.exercise_evaluations
  for each row execute function public.trigger_set_timestamp();

-- RLS 有効化と権限の明示的剥奪
alter table public.exercise_evaluations enable row level security;

revoke all on table public.exercise_evaluations from anon;
revoke all on table public.exercise_evaluations from authenticated;
