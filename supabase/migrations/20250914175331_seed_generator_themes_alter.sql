-- 作成者
do $$ begin
  create type seed_generator_theme_created_type as enum ('system','admin');
exception when duplicate_object then null; end $$;

alter table public.seed_generator_themes add column created_by seed_generator_theme_created_type;

alter table public.seed_generator_themes add column canonical_key text not null default '';
