BEGIN;
SELECT plan(1);


-- anonに危険な権限（INSERT/UPDATE/DELETE）が付いていない
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM information_schema.role_table_grants g
    WHERE g.table_schema='public' AND g.grantee='anon'
      AND g.privilege_type IN ('INSERT','UPDATE','DELETE')
  ),
  'anon has no write privileges'
);

-- 失敗時だけ、どのテーブルに何の権限が付いているかを diag で出す
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.role_table_grants g
      WHERE g.table_schema = 'public'
        AND g.grantee = 'anon'
        AND g.privilege_type IN ('INSERT','UPDATE','DELETE')
    ) THEN diag(
      'Offending grants for anon:' || E'\n  - ' ||
      (
        SELECT string_agg(
          format('%I.%I  %s', g.table_schema, g.table_name, g.privilege_type),
          E'\n  - '
        )
        FROM information_schema.role_table_grants g
        WHERE g.table_schema = 'public'
          AND g.grantee = 'anon'
          AND g.privilege_type IN ('INSERT','UPDATE','DELETE')
      )
    )
  END;

SELECT * FROM finish();
ROLLBACK;
