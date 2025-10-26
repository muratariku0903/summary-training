-- RLS 有効化
alter table public.job_runs enable row level security;

-- 匿名/認証ユーザーのテーブル権限を明示的に剥奪
revoke all on table public.job_runs from anon;
revoke all on table public.job_runs from authenticated;
