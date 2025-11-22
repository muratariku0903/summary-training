alter table public.exercise_evaluation_details
  add column if not exists rubric jsonb;
