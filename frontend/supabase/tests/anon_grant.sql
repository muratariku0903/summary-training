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

SELECT * FROM finish();
ROLLBACK;
