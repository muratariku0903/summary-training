# Supabase CLI — Local Development Guide

> *Version: 2025‑05‑08*  —  verified with **Supabase CLI v2.41.0**

---

## 0. Prerequisites

| Tool | Recommended install | Notes |
|------|---------------------|-------|
| Docker Desktop (>= 4.25) | `brew install --cask docker` | 必ず GUI を **Running** 状態にする。ソケットは `$HOME/.docker/run/docker.sock` |
| Supabase CLI (>= v2) | `brew install supabase/tap/supabase` <br>`supabase --version` | v1 系とは **config.toml の書式が異なる** |
| psql (optional) | `brew install libpq` ⇒ `echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc` | DB に直接入るときに便利 |

---

## 1. プロジェクト初期化 & 設定ファイル

```bash
supabase init --force            # .supabase/ と config.toml を生成
```

**config.toml (抜粋)**
```toml
project_id = "local-dev"  # v2 から project_ref → project_id

[db]                    # v2 から [database] → [db]
major_version = 15
```

> リモートプロジェクトと紐付けるときは **ファイルではなく CLI** で:  
> `supabase login` → `supabase link --project-ref <ref>`

---

## 2. ローカルスタック起動

```bash
supabase start             # Docker Compose を動的生成し up
```

起動後に得られる主要ポート

| Service | Purpose | Port |
|---------|---------|------|
| Kong API Gateway | 全 REST / GraphQL / Edge 経由入口 | **54321** |
| Postgres | ローカル DB | 54322 |
| Supabase Studio | 管理 UI | **54323** |

> **起動に失敗したら** `docker ps` や `docker logs <container>` でヘルスチェック。

---

## 3. ヘルスチェック手順

```bash
# すべて running?
supabase status

docker ps --format 'table {{.Names}}\t{{.Status}}' | grep supabase

# API 健康
curl -I http://localhost:54321/health   # → 200 OK

# Postgres 直結 (psql)
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c '\dt'
```

---

## 4. スキーマ管理ワークフロー

### 4‑1. 新規マイグレーションを作る
```bash
supabase migration new create_users_table
```
編集: `supabase/migrations/<timestamp>_create_users_table.sql`

### 4‑2. 差分生成 (GUI で変更 → SQL 化)
```bash
supabase db diff -f add_more_columns
```

### 4‑3. 適用 / リセット
```bash
supabase db reset        # migrations 全適用 + seed.sql
#    ↑ 開発用。データごと初期化したいとき

# 本番や共有環境には
supabase db push         # リモートに適用
```

---

## 5. ダミーデータ (シード) の入れ方

### 📖 方式 A — `seed.sql` (ローカル限定)

```bash
# supabase/seed.sql
insert into public.users (email, full_name) values
  ('alice@example.com',  'Alice A.'),
  ('bob@example.com',    'Bob B.'),
  ... -- 合計 10 行
```

`supabase db reset` または `supabase start` 時に自動実行。

### 🔄 方式 B — INSERT を含むマイグレーション
* `supabase migration new seed_users_data`
* INSERT を書き込む
* `supabase db reset` / `supabase db push` で一度だけ流れる

> 本番に不要なダミーは **方式 A** が安全。

---

## 6. トラブルシューティング

| 症状 | 解決策 |
|------|--------|
| `Cannot connect to the Docker daemon at ...docker.sock` | *Docker Desktop が Running?*  
`export DOCKER_HOST=unix://$HOME/.docker/run/docker.sock`  
`sudo ln -s $HOME/.docker/run/docker.sock /var/run/docker.sock` |
| コンテナが `exited (1)` | `docker logs <name>` でスタックトレースを確認 |
| DB への接続失敗 | `54322` ポートが別プロセスで使用されていないか確認 |

---

## 7. 便利コマンド早見表

```bash
supabase init --force        # 構成ファイルを作り直し
supabase start / stop        # スタック起動 / 停止
supabase status              # 稼働状況一覧
supabase migration new <n>   # 空のマイグレーション
supabase db diff -f <n>      # 差分 SQL 生成
supabase db reset            # DB 初期化 + マイグレーション + シード
supabase db push             # リモート DB に反映 (要 supabase link)
```

---

## 8. リモートプロジェクト運用

### 8‑1. CLI とクラウドをリンク
```bash
supabase login        # PAT をブラウザで発行
supabase link         # ダッシュボード上のプロジェクトを選択
```
<link> が ~/.supabase/<project-ref>.json に保存され、以後の CLI コマンドは対象プロジェクトを自動認識します。

### 8‑2. ローカル → リモートへスキーマを反映
```bash
# まずは影響 SQL を確認（推奨）
supabase db push --dry-run

# 問題なければ本番／ステージ環境へ適用
supabase db push

# シードも送りたい場合（CLI v2.39+）
supabase db push --include-seed
```

### 8‑3. GUI 変更をローカルへ取り込む
```bash
supabase db pull            # diff を自動で migration 化
```

### 8‑4. 追加ユーティリティ
| コマンド | 用途 |
|----------|------|
| `supabase db remote commit` | 既存 DB を基点として打刻（後追い IaC 用） |
| `supabase db remote reset`  | リモート DB をマイグレーション初期状態に戻す（破壊的） |
| `supabase db dump --schema-only` | スキーマだけダンプしてバックアップ |

---

## 9. 便利コマンド早見表（更新）
```bash
supabase login / link         # CLI とクラウドを接続
supabase init --force         # 構成ファイルを作り直し
supabase start / stop         # スタック起動 / 停止
supabase status               # 稼働状況一覧
supabase migration new <n>    # 空のマイグレーション
supabase db diff -f <n>       # 差分 SQL 生成
supabase db reset             # DB 初期化 + マイグレーション + シード
supabase db push [--dry-run]  # リモートへ適用
supabase db pull              # リモート変更を diff 取得
```

---

## 10. 参考ドキュメント

* [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
* [Local Development Setup](https://supabase.com/docs/guides/cli/local-development)
* [Migrations & Seeding](https://supabase.com/docs/guides/cli/migrations)

---

Happy hacking!  🎉

