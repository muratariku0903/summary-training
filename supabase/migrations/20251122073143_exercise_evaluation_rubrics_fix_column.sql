BEGIN;

ALTER TABLE public.exercise_evaluation_rubrics
  ALTER COLUMN weight TYPE double precision USING (weight::double precision);

COMMIT;
