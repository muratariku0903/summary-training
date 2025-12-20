create extension if not exists pg_trgm;  -- 近似重複チェック用

create unique index if not exists uidx_sgt_canonical_key
  on public.seed_generator_themes(canonical_key);

-- 近似重複検知用（類似度検索に使用）
create index if not exists idx_sgt_name_trgm
  on public.seed_generator_themes
  using gin (title gin_trgm_ops);
