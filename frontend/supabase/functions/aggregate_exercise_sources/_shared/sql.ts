import { createAdvisoryLockQuery } from '../../_shared/db/process.ts'

export const SQL_ACQUIRE_LOCK_THEME_SOURCES = createAdvisoryLockQuery(
  'aggregate_exercise_sources_v1',
)

/**
 * seedをテーマでグルーピングし、同様にテーマでグルーピングしたsourceとの差分を新規sourceとして追加
 * 追加するテーマが既にsourceに存在してる場合はスキップ
 */
export const SQL_UPSERT_SOURCES_BY_THEMES = `
with target_themes as (
  select distinct s.theme_id
  from public.exercise_generator_seeds s
  join public.seed_generator_profiles p on p.id = s.generator_profile_id
  where p.profile_type = 'ai_theme'
    and s.status = 'active'
    and s.theme_id is not null
),
missing as (
  select t.theme_id
  from target_themes t
  left join public.exercise_generator_sources src
     on src.aggregate_type = 'theme'
    and src.theme_id = t.theme_id
  where src.id is null
)
insert into public.exercise_generator_sources (id, title, description, theme_id, aggregate_type)
select
  gen_random_uuid(),
  th.title,
  th.description,
  th.id,
  'theme'
from missing m
join public.seed_generator_themes th on th.id = m.theme_id
on conflict (theme_id, aggregate_type) do nothing
returning id, theme_id
`

/**
 * seedとsourceを同じテーマで結合し、関連テーブルに未登録のペアがあれば保存する
 */
export const SQL_INSERT_SEED_SOURCE_LINKS_BY_THEME = `
insert into public.exercise_generator_source_seeds (source_id, seed_id)
select src.id, s.id
from public.exercise_generator_seeds s
join public.seed_generator_profiles p on p.id = s.generator_profile_id
join public.exercise_generator_sources src
   on src.aggregate_type = 'theme'
  and src.theme_id = s.theme_id
left join public.exercise_generator_source_seeds link
  on link.source_id = src.id and link.seed_id = s.id
where p.profile_type = 'ai_theme'
  and s.status = 'active'
  and s.theme_id is not null
  and link.seed_id is null
on conflict do nothing
returning source_id, seed_id
`

/**
 * 実際に関連付けされたseedと実在するseedのテーマごとの数を出力
 */
export const SQL_SEED_SOURCE_AGGREGATION_STATUS_BY_THEME = `
-- c1: 実際に関連付けされたseedの数
with c1 as (
  select s.theme_id, count(*) as linked_seeds
  from public.exercise_generator_source_seeds ss
  join public.exercise_generator_seeds s on s.id = ss.seed_id
  join public.seed_generator_profiles p on p.id = s.generator_profile_id
  join public.exercise_generator_sources src on src.id = ss.source_id
  where p.profile_type = 'ai_theme'
    and s.status = 'active'
    and s.theme_id is not null
    and src.aggregate_type = 'theme'
  group by s.theme_id
),
-- c2: 対象となるseedの総数
c2 as (
  select s.theme_id, count(*) as target_seeds
  from public.exercise_generator_seeds s
  join public.seed_generator_profiles p on p.id = s.generator_profile_id
  where p.profile_type = 'ai_theme'
    and s.status = 'active'
    and s.theme_id is not null
  group by s.theme_id
)
select
  coalesce(c2.theme_id, c1.theme_id) as theme_id,
  coalesce(linked_seeds, 0)::int as linked_seeds,
  coalesce(target_seeds, 0)::int as target_seeds
from c1 full outer join c2 using (theme_id)
order by theme_id
`
