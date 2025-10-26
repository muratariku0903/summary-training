create or replace function public.find_similar_seeds_by_raw_text(
  q text,
  min_sim double precision default 0.87,
  lim int default 3
)
returns table(
  id uuid,
  title text,
  sim double precision,
  snippet text
)
language sql
stable
as $$
  with norm as (
    select left(public._trgm_normalize(coalesce(q, '')), 3000) as nq
  )
  select
    s.id,
    s.title,
    similarity(s.raw_text_trgm_generated, norm.nq) as sim,
    left(s.raw_text_trgm_generated, 180) as snippet
  from public.exercise_generator_seeds s, norm
  where s.status = 'active'
    and s.raw_text_trgm_generated % norm.nq
    and similarity(s.raw_text_trgm_generated, norm.nq) >= min_sim
  order by sim desc
  limit lim
$$;
