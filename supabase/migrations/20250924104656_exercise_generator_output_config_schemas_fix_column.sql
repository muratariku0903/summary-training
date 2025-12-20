-- 外部キーを一旦 NOT VALID で付与（即時全件検査を避ける）
ALTER TABLE public.exercise_generator_output_configs_schemas
  ALTER COLUMN llm_id TYPE uuid USING llm_id::uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_ex_out_cfg_schema_llm'
  ) THEN
    ALTER TABLE public.exercise_generator_output_configs_schemas
      ADD CONSTRAINT fk_ex_out_cfg_schema_llm
      FOREIGN KEY (llm_id)
      REFERENCES public.llms(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT
      NOT VALID;
  END IF;
END $$;
