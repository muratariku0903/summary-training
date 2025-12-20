-- RLS 有効化
alter table public.seed_generator_theme_categories enable row level security;

-- 匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.seed_generator_theme_categories from anon;
revoke all on table public.seed_generator_theme_categories from authenticated;
