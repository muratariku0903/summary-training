alter table public.exercise_generator_seeds add column llm_id uuid references public.llms(id) on delete cascade
