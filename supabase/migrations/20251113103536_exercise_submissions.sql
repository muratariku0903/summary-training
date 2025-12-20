CREATE TABLE public.exercise_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL,
  user_id uuid NOT NULL,
  payload text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exercise_submissions_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id),
  CONSTRAINT exercise_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX exercise_submissions_exercise_id_idx ON public.exercise_submissions (exercise_id);
CREATE INDEX exercise_submissions_user_id_idx ON public.exercise_submissions (user_id);

-- RLS 有効化
alter table public.job_runs enable row level security;

-- 匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.job_runs from anon;
revoke all on table public.job_runs from authenticated;

