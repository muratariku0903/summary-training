ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS generate_profile_id uuid NOT NULL REFERENCES public.exercise_generator_profiles(id);
