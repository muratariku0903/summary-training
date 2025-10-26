ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS delete_flg bool NOT NULL DEFAULT false;
