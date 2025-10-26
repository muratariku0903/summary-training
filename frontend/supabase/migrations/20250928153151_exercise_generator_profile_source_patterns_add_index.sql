create unique index if not exists uq_profile_set
  on public.exercise_generator_profile_source_patterns(profile_id, source_set_key);
