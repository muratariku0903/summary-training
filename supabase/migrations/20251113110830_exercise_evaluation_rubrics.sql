create table if not exists public.exercise_evaluation_rubrics (
  version integer not null,                                  -- PK(1)
  exercise_type public.exercise_type not null,               -- PK(2) exercises 由来 enum
  difficulty public.difficulty_level not null,               -- PK(3) exercises 由来 enum
  perspective text,                                          -- 文字列
  perspective_name text,                                     -- 文字列
  detail text,                                               -- 文字列
  weight numeric,                                            -- 数値
  is_active boolean not null default true,                   -- ブール
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_evaluation_rubrics_pkey primary key (version, exercise_type, difficulty)
);

-- updated_at 自動更新トリガ
drop trigger if exists trg_exercise_evaluation_rubrics_updated_at on public.exercise_evaluation_rubrics;
create trigger trg_exercise_evaluation_rubrics_updated_at
  before update on public.exercise_evaluation_rubrics
  for each row execute function public.trigger_set_timestamp();

-- RLS 有効化と権限の明示的剥奪
alter table public.exercise_evaluation_rubrics enable row level security;

revoke all on table public.exercise_evaluation_rubrics from anon;
revoke all on table public.exercise_evaluation_rubrics from authenticated;
