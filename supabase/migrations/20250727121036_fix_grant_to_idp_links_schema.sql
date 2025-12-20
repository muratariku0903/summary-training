-- 該当シーケンスに USAGE / SELECT を付与
grant usage, select on sequence public.idp_links_id_seq to service_role;

-- 将来作るシーケンスにも自動付与（保険）
alter default privileges in schema public
  grant usage, select on sequences to service_role;
