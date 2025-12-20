-- RLS 有効化
alter table public.exercise_generator_profile_source_patterns enable row level security;

-- 匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.exercise_generator_profile_source_patterns from anon;
revoke all on table public.exercise_generator_profile_source_patterns from authenticated;
