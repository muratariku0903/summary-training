  -- 1) Source をテーマ単位で一意化
ALTER TABLE public.exercise_generator_sources
  ADD COLUMN IF NOT EXISTS theme_id uuid NULL
  REFERENCES public.seed_generator_themes(id);

-- テーマ紐づけ Source を1件に制約（テーマ以外のSourceはNULLのまま）
CREATE UNIQUE INDEX IF NOT EXISTS exercise_generator_sources_theme_key
ON public.exercise_generator_sources(theme_id)
WHERE theme_id IS NOT NULL;
