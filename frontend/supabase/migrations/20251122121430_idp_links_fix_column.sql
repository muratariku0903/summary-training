BEGIN;

-- 型変更（USER-DEFINED → text）
ALTER TABLE public.idp_links
  ALTER COLUMN email_at_link_time TYPE text
  USING (email_at_link_time::text);

COMMIT;
