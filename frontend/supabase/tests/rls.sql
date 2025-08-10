BEGIN;
SELECT plan(2);

-- 例: RLS不要な公開参照テーブルは許可リストに入れる
CREATE TEMP TABLE allowlist(relname text) ON COMMIT DROP;
INSERT INTO allowlist VALUES ('countries'), ('prefectures');

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

-- 2) anonに危険な権限（INSERT/UPDATE/DELETE）が付いていない
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM information_schema.role_table_grants g
    WHERE g.table_schema='public' AND g.grantee='anon'
      AND g.privilege_type IN ('INSERT','UPDATE','DELETE')
  ),
  'anon has no write privileges'
);

SELECT * FROM finish();
ROLLBACK;
