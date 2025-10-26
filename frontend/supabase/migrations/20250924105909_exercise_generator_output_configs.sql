DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exercise_output_data_type') THEN
    CREATE TYPE public.exercise_output_data_type AS ENUM ('text', 'audio', 'text/audio');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exercise_output_exercise_type') THEN
    CREATE TYPE public.exercise_output_exercise_type AS ENUM ('summary', 'rewrite');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exercise_output_difficulty') THEN
    CREATE TYPE public.exercise_output_difficulty AS ENUM ('easy', 'medium', 'hard');
  END IF;
END $$;


CREATE TABLE public.exercise_generator_output_configs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  description   text,
  llm_id        uuid NOT NULL,
  data_type     public.exercise_output_data_type     NOT NULL,
  exercise_type public.exercise_output_exercise_type NOT NULL,
  difficulty    public.exercise_output_difficulty    NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT exercise_generator_output_configs_uni4
    UNIQUE (llm_id, data_type, exercise_type, difficulty)
);


-- 3) updated_at 自動更新トリガ（共通関数が未定義なら作成）
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ex_out_cfg_updated_at
  ON public.exercise_generator_output_configs;

CREATE TRIGGER trg_ex_out_cfg_updated_at
BEFORE UPDATE ON public.exercise_generator_output_configs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_ex_out_cfg_quad_to_schemas'
  ) THEN
    ALTER TABLE public.exercise_generator_output_configs
      ADD CONSTRAINT fk_ex_out_cfg_quad_to_schemas
      FOREIGN KEY (llm_id, data_type, exercise_type, difficulty)
      REFERENCES public.exercise_generator_output_configs_schemas
                 (llm_id, data_type, exercise_type, difficulty)
      ON UPDATE CASCADE
      ON DELETE RESTRICT
      NOT VALID;
  END IF;
END $$;


-- RLS 有効化
alter table public.exercise_generator_output_configs enable row level security;

-- 匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.exercise_generator_output_configs from anon;
revoke all on table public.exercise_generator_output_configs from authenticated;
