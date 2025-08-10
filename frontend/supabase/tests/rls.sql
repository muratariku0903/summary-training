BEGIN;
SELECT plan(1);

-- 例: RLS不要な公開参照テーブルは許可リストに入れる
WITH allowlist AS (
  SELECT unnest(ARRAY['countries','prefectures']) AS relname
)
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN allowlist a ON a.relname = c.relname
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r','p')          -- r: 普通のテーブル, p: パーティション親
      AND a.relname IS NULL               -- 許可リストは除外
      AND c.relrowsecurity = false        -- ← RLS無効を検出
  ),
  'RLS is enabled on all public tables (except allowlist)'
);

-- 失敗時の調査用に、RLS未有効テーブル名を出力
SELECT diag(
  'Tables missing RLS: ' ||
  coalesce((
    SELECT string_agg(format('%I.%I', n.nspname, c.relname), ', ')
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN allowlist a ON a.relname = c.relname
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r','p')
      AND a.relname IS NULL
      AND c.relrowsecurity = false
  ), '<none>')
);

SELECT * FROM finish();
ROLLBACK;
