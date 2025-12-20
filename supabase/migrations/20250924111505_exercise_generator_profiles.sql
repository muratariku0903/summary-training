CREATE TABLE public.exercise_generator_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  description      text,
  output_config_id uuid        NOT NULL, -- FK to exercise_generator_output_configs(id)
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);


COMMENT ON TABLE  public.exercise_generator_profiles
  IS '演習題材ジェネレータのプロファイル（どの出力設定を使うか等をまとめる）';
COMMENT ON COLUMN public.exercise_generator_profiles.output_config_id
  IS '参照: exercise_generator_output_configs(id)';
COMMENT ON COLUMN public.exercise_generator_profiles.is_active
  IS '有効/無効フラグ（論理削除や切替に利用）';


CREATE INDEX IF NOT EXISTS idx_ex_gen_profiles_output_config
  ON public.exercise_generator_profiles (output_config_id);


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_ex_gen_profiles_output_config'
  ) THEN
    ALTER TABLE public.exercise_generator_profiles
      ADD CONSTRAINT fk_ex_gen_profiles_output_config
      FOREIGN KEY (output_config_id)
      REFERENCES public.exercise_generator_output_configs(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT
      NOT VALID;
  END IF;
END $$;


CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ex_gen_profiles_updated_at
  ON public.exercise_generator_profiles;

CREATE TRIGGER trg_ex_gen_profiles_updated_at
BEFORE UPDATE ON public.exercise_generator_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();


-- RLS 有効化
alter table public.exercise_generator_profiles enable row level security;

-- 匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.exercise_generator_profiles from anon;
revoke all on table public.exercise_generator_profiles from authenticated;

