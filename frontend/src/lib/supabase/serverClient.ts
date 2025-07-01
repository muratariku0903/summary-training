import { createClient } from '@supabase/supabase-js'

// 用途: 主にサーバー環境（Node.js のバックエンド、APIエンドポイント、サーバーサイドレンダリングなど）で使用されます。
// 認証キー: process.env.SUPABASE_SERVICE_ROLE_KEY! を使用します。これは Supabase の Service Role Key (要するに管理者権限) であり、Supabase インスタンスに対する管理者レベルの権限を持っています。RLS をバイパスし、データベース内のすべてのデータにアクセスしたり、データの作成、更新、削除を自由に行うことができます。
// セキュリティ: このキーは非常に強力なため、絶対にクライアントサイドに公開してはいけません。 もしクライアントサイドに漏洩した場合、悪意のあるユーザーがデータベースのすべてのデータを操作できてしまう可能性があります。
export const serverClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
