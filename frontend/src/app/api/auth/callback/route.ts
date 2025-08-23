// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client/serverComponentClient'
import { PROTECTED_PATHS, PUBLIC_PATHS } from '@/lib/constants/routes'

// 認可コードとセッション情報を交換する中間エンドポイント
// OAuth認証後にリダイレクトされる想定
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const redirect = url.searchParams.get('redirectTo') ?? PUBLIC_PATHS.HOME

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('PKCE code exchange failed:', error.message)
      // 適宜エラーページへリダイレクト
      return NextResponse.redirect(new URL('/auth/error', url).toString())
    }
    // ユーザーがMFA設定済みの場合はログイン画面にリダイレクトし、MFAの認証をしてもらう
    const verifiedFactors = data.user?.factors?.filter((f) => f.status === 'verified')
    if (verifiedFactors && verifiedFactors?.length > 0) {
      return NextResponse.redirect(new URL(PROTECTED_PATHS.MFA_VERIFY, url).toString())
    }
  }

  // セッション Cookie がセットされた状態で redirectToで指定したURL へ
  return NextResponse.redirect(new URL(redirect, url).toString())
}
