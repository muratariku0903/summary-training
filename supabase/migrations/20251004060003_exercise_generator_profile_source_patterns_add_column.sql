ALTER TABLE public.exercise_generator_profile_source_patterns
  ADD COLUMN IF NOT EXISTS delete_flg bool NOT NULL DEFAULT false;
