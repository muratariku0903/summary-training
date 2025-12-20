alter table public.exercise_generator_profiles
  add column if not exists source_combo_min int2 not null default 1,
  add column if not exists source_combo_max int2 not null default 1,
  add column if not exists allow_repeat_when_exhausted boolean not null default false;
