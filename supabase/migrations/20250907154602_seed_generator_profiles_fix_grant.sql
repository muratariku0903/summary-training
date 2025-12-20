

-- RLS 有効化
alter table public.seed_generator_profiles enable row level security;

-- 念のため、匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.seed_generator_profiles from anon;
revoke all on table public.seed_generator_profiles from authenticated;
