-- 1) trigram 拡張
create extension if not exists pg_trgm;

-- 2) 文字列正規化のヘルパ（IMMUTABLE）
--    - NFKC正規化はDB側では扱いが重くなるため、まずは lower + 空白圧縮 + trim に限定
--    - 必要になれば運用でルールを拡張（記号を空白化など）
create or replace function public._trgm_normalize(s text)
returns text
language sql
immutable
parallel safe
as $$
  select btrim(regexp_replace(lower(coalesce(s,'')), '\s+', ' ', 'g'));
$$;

alter table public.exercise_generator_seeds
  add column if not exists raw_text_trgm_generated text
  generated always as ( left(public._trgm_normalize(raw_text), 3000) ) stored;

  comment on column public.exercise_generator_seeds.raw_text_trgm_generated
  is 'trigram 用の生成列。raw_text を正規化し先頭3000字に切り詰めたもの。';

  -- 4) trigram GIN index（title / raw_text_trgm_generated）
create index if not exists idx_egs_title_trgm
  on public.exercise_generator_seeds
  using gin (title gin_trgm_ops);

create index if not exists idx_egs_raw_text_trgm
  on public.exercise_generator_seeds
  using gin (raw_text_trgm_generated gin_trgm_ops);
