-- 認証済みユーザーが自分の演習を読み取れるポリシー
CREATE POLICY "認証済みユーザーは演習を読み取れる"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'exercises');
