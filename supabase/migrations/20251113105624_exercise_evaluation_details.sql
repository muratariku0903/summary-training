create table if not exists public.exercise_evaluation_details (
  id uuid primary key default gen_random_uuid(),            -- PK
  evaluation_id uuid not null,                              -- FK -> exercise_evaluations.id
  perspective text,                                         -- 文字列
  perspective_name text,                                    -- 文字列
  perspective_satisfy_rate numeric,                         -- 数値
  reason text,                                              -- 文字列
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_evaluation_details_evaluation_id_fkey
    foreign key (evaluation_id) references public.exercise_evaluations(id)
    on delete cascade
);

-- 参照用インデックス
create index if not exists exercise_evaluation_details_evaluation_id_idx
  on public.exercise_evaluation_details (evaluation_id);

-- updated_at 自動更新トリガ
drop trigger if exists trg_exercise_evaluation_details_updated_at on public.exercise_evaluation_details;
create trigger trg_exercise_evaluation_details_updated_at
  before update on public.exercise_evaluation_details
  for each row execute function public.trigger_set_timestamp();

-- RLS 有効化と権限の明示的剥奪
alter table public.exercise_evaluation_details enable row level security;

revoke all on table public.exercise_evaluation_details from anon;
revoke all on table public.exercise_evaluation_details from authenticated;
