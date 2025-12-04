// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/client/serverComponentClient'
import { PROTECTED_PATHS, PUBLIC_PATHS } from '@/lib/constants/routes'
import { withLogger } from '@/lib/api/wrapper'
import { LOG_MESSAGES } from '@/lib/log/message'

// 認可コードとセッション情報を交換する中間エンドポイント
// OAuth認証後にリダイレクトされる想定
export const GET = withLogger(async (req: NextRequest, { logger }) => {
  logger.info(LOG_MESSAGES.PROCESSING.STARTED)

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const redirect = url.searchParams.get('redirectTo') ?? PUBLIC_PATHS.HOME

  logger.setContext({ redirectTo: redirect, hasCode: !!code })

  if (code) {
    logger.info(LOG_MESSAGES.AUTH.CODE_EXCHANGE_STARTED)

    const supabase = await createServerComponentClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const msg = LOG_MESSAGES.AUTH.CODE_EXCHANGE_FAILED
      logger.error(msg, error, { errorMessage: error.message })
      logger.info(LOG_MESSAGES.PROCESSING.REDIRECT_TO_ERROR)
      return NextResponse.redirect(new URL('/auth/error', url).toString())
    }

    logger.info(LOG_MESSAGES.AUTH.CODE_EXCHANGE_COMPLETED, {
      userId: data.user?.id,
    })

    logger.setContext({ userId: data.user?.id })

    // ユーザーがMFA設定済みの場合はログイン画面にリダイレクトし、MFAの認証をしてもらう
    const verifiedFactors = data.user?.factors?.filter((f) => f.status === 'verified')
    if (verifiedFactors && verifiedFactors?.length > 0) {
      logger.info(LOG_MESSAGES.AUTH.MFA_REQUIRED, {
        factorCount: verifiedFactors.length,
      })
      logger.info(LOG_MESSAGES.PROCESSING.REDIRECT_TO_MFA)
      return NextResponse.redirect(new URL(PROTECTED_PATHS.MFA_VERIFY, url).toString())
    }
  } else {
    logger.warn(LOG_MESSAGES.PROCESSING.CODE_MISSING)
  }

  // セッション Cookie がセットされた状態で redirectToで指定したURL へ
  logger.info(LOG_MESSAGES.PROCESSING.REDIRECT_TO_HOME, {
    destination: redirect,
  })
  logger.info(LOG_MESSAGES.PROCESSING.COMPLETED)

  return NextResponse.redirect(new URL(redirect, url).toString())
})
