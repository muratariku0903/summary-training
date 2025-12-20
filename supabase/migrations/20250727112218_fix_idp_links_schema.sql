-- 既に private にある場合
alter table private.idp_links set schema public;

-- RLS と権限（deny-all）
alter table public.idp_links enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='idp_links' and policyname='deny_all'
  ) then
    create policy deny_all on public.idp_links
      for all using (false) with check (false);
  end if;
end$$;

revoke all on table public.idp_links from anon, authenticated;
grant select, insert, update, delete on table public.idp_links to service_role;
