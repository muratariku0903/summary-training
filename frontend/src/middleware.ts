import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase/client/middlewareClient'
import {
  PROTECTED_PATHS,
  PUBLIC_PATHS,
  UNAUTHENTICATED_USER_PATHS,
} from '@/lib/constants/routes'
import dayjs from 'dayjs'
import { deleteTokenFromCookie } from './lib/api/utils'
import { checkValidSessionLevel } from './lib/supabase/auth/server'
import { sanitizeLog } from './utils/log'

/**
 * Next.js ミドルウェア
 * - すべてのリクエストに対してページ描画前に実行される
 * - Edge Runtime（サーバーサイド）で動作
 * - 認証チェックとルーティング制御を行う
 */
export async function middleware(req: NextRequest) {
  console.log(
    `🚀 Middleware triggered for: ${sanitizeLog(req.nextUrl.pathname)} at ${dayjs().format('YYYY-MM-DDTHH:mm:ss')}`,
  )

  // Edge Runtime専用クライアントを使用
  const { client: supabaseMiddlerWareClient, response: updatedResponse } =
    createMiddlewareSupabaseClient(req)

  // 内部でCookieから認証情報を読み取り・検証
  //　トークン切れになっていた場合内部でリフレッシュしてトークンを更新
  const {
    data: { session },
  } = await supabaseMiddlerWareClient.auth.getSession()
  const { pathname } = req.nextUrl

  const isProtected = Object.values(PROTECTED_PATHS).some((path) =>
    pathname.startsWith(path),
  )

  // 認証がない状態で保護ルートにアクセスした場合、/auth/signin へリダイレクト
  if (isProtected) {
    if (!session) {
      const signinUrl = req.nextUrl.clone()
      signinUrl.pathname = PUBLIC_PATHS.SIGNIN
      return NextResponse.redirect(signinUrl)
    }

    // ユーザー情報を取得して、MFA設定をしてるユーザーであればセッションレベルがAAL2であるかチェック
    // AAL2でない場合はセッション情報を破棄してサインイン画面へリダイレクト
    const { data: user, error: getUserError } =
      await supabaseMiddlerWareClient.auth.getUser(session.access_token)
    if (getUserError) {
      console.warn('fail get user:', getUserError)
    }
    if (user.user) {
      const { valid } = await checkValidSessionLevel(user.user, supabaseMiddlerWareClient)
      if (!valid) {
        const signinUrl = req.nextUrl.clone()
        signinUrl.pathname = PUBLIC_PATHS.SIGNIN
        return await deleteTokenFromCookie(NextResponse.redirect(signinUrl))
      }
    }
  }

  // ログイン済ユーザーが未ログインユーザー画面にアクセスした場合、/dashboard へリダイレクト
  if (session && UNAUTHENTICATED_USER_PATHS.some((path) => pathname === path)) {
    const dashboardUrl = req.nextUrl.clone()
    dashboardUrl.pathname = PROTECTED_PATHS.DASHBOARD
    return NextResponse.redirect(dashboardUrl)
  }

  return updatedResponse
}

/**
 * ミドルウェアの適用範囲を制御する設定
 * - Next.jsが自動的にこの設定を読み取り、パターンマッチングを実行
 * - 静的ファイル（CSS、JS、画像など）は除外してパフォーマンス向上
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
