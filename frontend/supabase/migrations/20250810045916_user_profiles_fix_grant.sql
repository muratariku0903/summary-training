-- 認証済みユーザーには必要権限を付与
REVOKE INSERT, UPDATE, DELETE ON public.user_profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
