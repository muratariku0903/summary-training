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


CREATE TABLE IF NOT EXISTS public.exercise_generator_output_configs_schemas (
  llm_id        text                                         NOT NULL, -- 例: 'openai:gpt-4o-mini'
  data_type     public.exercise_output_data_type             NOT NULL, -- 'text' | 'audio'
  exercise_type public.exercise_output_exercise_type         NOT NULL, -- 'summary' | 'rewrite'
  difficulty    public.exercise_output_difficulty            NOT NULL, -- 'easy' | 'medium' | 'hard'
  "schema"      jsonb                                        NOT NULL, -- 出力JSONのスキーマ定義
  created_at    timestamptz                                  NOT NULL DEFAULT now(),
  updated_at    timestamptz                                  NOT NULL DEFAULT now(),
  CONSTRAINT exercise_generator_output_configs_schemas_pkey
    PRIMARY KEY (llm_id, data_type, exercise_type, difficulty),
  CONSTRAINT exercise_generator_output_configs_schemas_schema_is_object
    CHECK (jsonb_typeof("schema") = 'object')
);

COMMENT ON TABLE  public.exercise_generator_output_configs_schemas
  IS 'LLM×データ種別×演習種別×難易度の組合せごとの出力JSONスキーマを保持';
COMMENT ON COLUMN public.exercise_generator_output_configs_schemas.llm_id        IS '利用するLLM識別子（ベンダ:モデル名など）';
COMMENT ON COLUMN public.exercise_generator_output_configs_schemas.data_type     IS '題材のデータ種別: text | audio';
COMMENT ON COLUMN public.exercise_generator_output_configs_schemas.exercise_type IS '演習タイプ: summary | rewrite';
COMMENT ON COLUMN public.exercise_generator_output_configs_schemas.difficulty    IS '難易度: easy | medium | hard';
COMMENT ON COLUMN public.exercise_generator_output_configs_schemas."schema"      IS '出力JSONのスキーマ（JSON Schema想定）';

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ex_out_cfg_schema_updated_at
  ON public.exercise_generator_output_configs_schemas;

CREATE TRIGGER trg_ex_out_cfg_schema_updated_at
BEFORE UPDATE ON public.exercise_generator_output_configs_schemas
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ---- (任意) よく使う検索に合わせた補助インデックス -----------------------
-- 複合PKはあるが、llm_id 単体等で絞る場合の助けに。
CREATE INDEX IF NOT EXISTS idx_ex_out_cfg_schema_llm
  ON public.exercise_generator_output_configs_schemas (llm_id);
