import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * ミドルウェア専用のSupabaseクライアント
 * Edge Runtime環境で動作するため、Node.js APIは使用不可
 */
export function createMiddlewareSupabaseClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Service Roleキーではなく、Anonキーを使用
    {
      /**
       * Supabaseが認証情報（Cookieに保存されたセッション）にアクセスするためのインターフェース
       * Edge Runtime環境では document.cookie が使えないため、Next.jsのCookie APIを橋渡しする
       * クライアントが認証処理をする際に自動的に裏で呼び出される
       */
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  return { client, response }
}
