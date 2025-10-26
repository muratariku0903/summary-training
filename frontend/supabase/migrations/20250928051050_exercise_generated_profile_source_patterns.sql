
-- 並べ替えて '_' 連結したキーを返す関数
create or replace function public.uuid_array_sorted_key(arr uuid[])
returns text
language sql
immutable
strict
parallel safe
as $$
  select array_to_string(
           (select array_agg(x order by x) from unnest(arr) as x),
           '_'
         );
$$;

create table public.exercise_generator_profile_source_patterns (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null
    references public.exercise_generator_profiles(id) on delete cascade,
  -- 例: ['c9..-id','a1..-id','b7..-id'] を“昇順”に並べ替えたセット
  source_ids uuid[] not null,

  source_set_key text generated always as (
    public.uuid_array_sorted_key(source_ids)
  ) stored,

  pattern_size smallint not null,
  usage_count int not null default 1,
  first_used_at timestamptz not null default now(),
  last_used_at  timestamptz not null default now(),

  constraint uq_profile_set unique (profile_id, source_set_key)
);

create index if not exists idx_profile_patterns_last_used
  on public.exercise_generator_profile_source_patterns(profile_id, last_used_at);
