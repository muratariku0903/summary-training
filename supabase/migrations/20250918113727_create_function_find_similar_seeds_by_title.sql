create or replace function public.find_similar_seeds_by_title(
  q text,
  min_sim double precision default 0.92,
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
  select
    s.id,
    s.title,
    similarity(s.title, q) as sim,
    left(s.raw_text_trgm_generated, 180) as snippet
  from public.exercise_generator_seeds s
  where s.status = 'active'
    and s.title % q
    and similarity(s.title, q) >= min_sim
  order by sim desc
  limit lim
$$;
