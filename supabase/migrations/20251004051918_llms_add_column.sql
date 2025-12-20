ALTER TABLE public.llms
  ADD COLUMN IF NOT EXISTS max_tokens int;
