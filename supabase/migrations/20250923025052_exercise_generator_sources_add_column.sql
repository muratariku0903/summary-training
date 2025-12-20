-- 1) 集約タイプ enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_aggregate_type') THEN
    CREATE TYPE source_aggregate_type AS ENUM ('theme', 'custom');
  END IF;
END$$;

-- 2) 列追加
ALTER TABLE public.exercise_generator_sources
  ADD COLUMN IF NOT EXISTS aggregate_type source_aggregate_type NOT NULL DEFAULT 'theme';
