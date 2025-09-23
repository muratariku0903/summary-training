ALTER TABLE public.exercise_generator_sources 
ADD CONSTRAINT exercise_generator_sources_theme_aggregate_unique 
UNIQUE (theme_id, aggregate_type);
