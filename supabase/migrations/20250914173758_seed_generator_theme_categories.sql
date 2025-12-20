create extension if not exists pgcrypto;

create table if not exists public.seed_generator_theme_categories (
  theme_id     uuid not null references public.seed_generator_themes(id) on delete cascade,
  category_id  uuid not null references public.seed_generator_categories(id) on delete cascade,
  primary key (theme_id, category_id)
);

create index if not exists idx_sgtc_category on public.seed_generator_theme_categories(category_id);

-- RLS 有効化
alter table public.seed_generator_categories enable row level security;

-- 匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.seed_generator_categories from anon;
revoke all on table public.seed_generator_categories from authenticated;
