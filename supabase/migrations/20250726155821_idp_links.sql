-- 1) 必要なら拡張
create extension if not exists citext;

-- 2) 非公開スキーマを用意（サーバー専用）
create schema if not exists private;

-- anon/authenticated からの利用を禁止
revoke all on schema private from anon, authenticated;
grant usage on schema private to postgres, service_role;

-- 3) リンク表
create table if not exists private.idp_links (
  id                bigserial primary key,
  provider          text        not null,                         -- 例: 'descope'
  external_user_id  text        not null,                         -- IdPの安定ID (例: JWTのsub)
  auth_user_id      uuid        not null
                                references auth.users(id)
                                on delete cascade,                -- Supabaseユーザー削除時にリンクも削除
  email_at_link_time citext,                                      -- 参考: リンク時点のメール（任意）
  metadata          jsonb       not null default '{}'::jsonb,     -- 補助クレームや監査情報など
  last_seen_at      timestamptz,                                  -- 最終ログイン時刻（任意）
  created_at        timestamptz not null default now(),

  -- 一意制約：同一IdP内で同じ外部IDが重複リンクされない
  unique (provider, external_user_id)

  -- （運用方針次第で有効化）
  -- 一意制約：1ユーザーが同一providerで複数外部IDを持たない
  -- , unique (auth_user_id, provider)
);

-- 4) インデックス（探索頻度が高いもの）
create index if not exists idx_idp_links_auth_user_id
  on private.idp_links (auth_user_id);
create index if not exists idx_idp_links_provider_external
  on private.idp_links (provider, external_user_id);

-- 5) 権限（Service Role のみ操作可）
revoke all on table private.idp_links from anon, authenticated;
grant select, insert, update, delete on table private.idp_links to service_role;

-- （任意）デフォルト権限も明示しておくと将来の列追加時に安全
alter default privileges in schema private
  revoke all on tables from anon, authenticated;
alter default privileges in schema private
  grant select, insert, update, delete on tables to service_role;

-- RLSは private スキーマに置き、API経由アクセスを与えない運用なら必須ではありません
-- （Service Role はRLSをバイパスします）。publicに置く場合はRLSで全面denyが無難です。
