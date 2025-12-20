alter table public.exercise_generator_seeds add column theme_id uuid references public.seed_generator_themes(id) on delete cascade
