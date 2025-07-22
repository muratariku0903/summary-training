// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client/serverComponentClient'
import { PUBLIC_PATHS } from '@/lib/constants/routes'

// 認可コードとセッションん情報を交換する中間エンドポイント
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const redirect = url.searchParams.get('redirectTo') ?? PUBLIC_PATHS.HOME

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('PKCE code exchange failed:', error.message)
      // 適宜エラーページへリダイレクト
      return NextResponse.redirect(new URL('/auth/error', url).toString())
    }
  }

  // セッション Cookie がセットされた状態で redirectToで指定したURL へ
  return NextResponse.redirect(new URL(redirect, url).toString())
}
