import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Supabase配下の.envファイルを読み込む
// デフォルトだとNext.jsはプロジェクト直下の.envファイルを読み込む
dotenv.config({ path: path.resolve(process.cwd(), 'supabase/.env') })

const isDocGen = process.env.GENERATE_OPENAPI === 'true'

// 用途: 主にサーバー環境（Node.js のバックエンド、APIエンドポイント、サーバーサイドレンダリングなど）で使用されます。
// 認証キー: process.env.SUPABASE_SERVICE_ROLE_KEY! を使用します。これは Supabase の Service Role Key (サービスロールキー) であり、Supabase インスタンスに対する管理者レベルの権限を持っています。RLS をバイパスし、データベース内のすべてのデータにアクセスしたり、データの作成、更新、削除を自由に行うことができます。
// セキュリティ: このキーは非常に強力なため、絶対にクライアントサイドに公開してはいけません。 もしクライアントサイドに漏洩した場合、悪意のあるユーザーがデータベースのすべてのデータを操作できてしまう可能性があります。
export const serverClient = createClient(
  isDocGen ? 'http://localhost:54321' : process.env.SUPABASE_URL!,
  isDocGen ? 'dummy-anon-key-for-docs' : process.env.SUPABASE_SERVICE_ROLE_KEY!
)
