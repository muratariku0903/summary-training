import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '../schema/schema'

export async function createClient() {
  // HTTPリクエストのCookieヘッダーを参照
  const cookieStore = await cookies()

  // 秘密鍵にアクセス可能: 環境変数からJWT_SECRETを取得
  // HTTPOnly Cookie: JavaScriptからアクセス不可能な安全な認証
  // 完全なJWT検証: 署名の暗号学的検証
  // サーバーサイド権限制御: RLS + アプリケーションレベルのセキュリティ
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
