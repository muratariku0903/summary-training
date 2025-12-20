-- 旧PKを削除
ALTER TABLE public.exercise_evaluation_rubrics
  DROP CONSTRAINT IF EXISTS exercise_evaluation_rubrics_pkey;

-- perspective を NOT NULL に
ALTER TABLE public.exercise_evaluation_rubrics
  ALTER COLUMN perspective SET NOT NULL;

-- 新PKを追加（version, exercise_type, difficulty, perspective）
ALTER TABLE public.exercise_evaluation_rubrics
  ADD CONSTRAINT exercise_evaluation_rubrics_pkey
  PRIMARY KEY (version, exercise_type, difficulty, perspective);
