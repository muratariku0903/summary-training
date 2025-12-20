create extension if not exists pg_trgm;

create or replace function public.find_similar_themes(
  q text,
  min_sim double precision default 0.85,
  lim int default 5
)
returns table(id uuid, title text, sim double precision)
language sql
stable
as $$
  select id, title, similarity(title, q) as sim
  from public.seed_generator_themes
  where similarity(title, q) >= min_sim
  order by sim desc
  limit lim
$$;
