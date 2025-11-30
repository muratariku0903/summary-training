import {
  Conflict,
  Forbidden,
  InternalError,
  Success,
  Unauthorized,
} from '@/lib/api/response'
import { verifyDescopeToken } from '@/lib/descope/verifyDescopeToken'
import { adminClient } from '@/lib/supabase/client/adminClient'
import { createServerComponentClient } from '@/lib/supabase/client/serverComponentClient'
import { ensureShadowUser } from '@/lib/supabase/idp/ensureShadowUser'
import { AuthError } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { withLogger } from '@/lib/api/wrapper'
import { LOG_MESSAGES } from '@/lib/log/message'

export const POST = withLogger(async (req: NextRequest, { logger }) => {
  logger.info(LOG_MESSAGES.PROCESSING.STARTED)

  try {
    // TODO: ヘッダー・メソッド検証
    // const ct = req.headers.get('content-type') || ''
    // if (!ct.includes('application/json')) {
    //   return NextResponse.json({ ok: false }, { status: 415 })
    // }

    // TODO: CSRF/Origin検証（SameSite=Lax運用でもPOSTはOriginチェック推奨）
    // const origin = req.headers.get('origin') ?? ''
    // if (!origin || !origin.endsWith(process.env.NEXT_PUBLIC_APP_ORIGIN!)) {
    //   return NextResponse.json({ ok: false }, { status: 403 })
    // }

    const { idpToken } = await req.json()

    // Descope JWT 検証（JWKS / iss / aud / exp / alg）
    logger.info(LOG_MESSAGES.AUTH.TOKEN_VERIFY_STARTED)
    const {
      success: verifySuccess,
      claims,
      message: verifyErrorMessage,
    } = await verifyDescopeToken(idpToken)
    if (!verifySuccess) {
      const msg = LOG_MESSAGES.AUTH.TOKEN_VERIFY_FAILED
      logger.warn(msg, { errorMessage: verifyErrorMessage })
      return Unauthorized({
        msg,
        details: verifyErrorMessage,
      }).toResponse()
    }
    logger.info(LOG_MESSAGES.AUTH.TOKEN_VERIFY_COMPLETED, {
      sub: claims.sub,
    })

    // メール条件：verifiedのみOK（未検証は409でオンボーディングへ）
    const email = typeof claims.email === 'string' ? claims.email : undefined
    if (!email || !claims.email_verified) {
      logger.warn(LOG_MESSAGES.AUTH.EMAIL_UNVERIFIED, {
        email,
        emailVerified: claims.email_verified,
      })
      return Conflict({ msg: 'email_onboarding_required' }).toResponse()
    }

    logger.setContext({ email, externalUserId: claims.sub })

    // シャドーユーザー確保（リンク表 → 既存探索 → 作成 → リンク作成）
    logger.info(LOG_MESSAGES.RESOURCE.SHADOW_USER_ENSURE_STARTED)
    const {
      success: ensureSuccess,
      code,
      authUserId,
      message: ensureErrorMessage,
    } = await ensureShadowUser({
      provider: 'descope',
      externalUserId: claims.sub,
      email,
      emailVerified: true,
    })
    if (!ensureSuccess) {
      const msg = LOG_MESSAGES.RESOURCE.SHADOW_USER_ENSURE_FAILED
      logger.error(msg, new Error(ensureErrorMessage), { code })
      return InternalError({
        msg,
        details: ensureErrorMessage,
      }).toResponse()
    }
    logger.info(LOG_MESSAGES.RESOURCE.SHADOW_USER_ENSURE_COMPLETED, {
      authUserId,
    })

    logger.setContext({ userId: authUserId })

    // Passkey認証の判別をするためにメタデータにプロバイダ情報として「descope_login_id」をセット
    logger.info(LOG_MESSAGES.RESOURCE.METADATA_UPDATE_STARTED)
    const { data: u } = await adminClient.auth.admin.getUserById(authUserId)
    const metadata = u.user?.app_metadata
    const newMetadata = {
      ...metadata,
      email_primary_provider:
        metadata?.email_primary_provider ?? metadata?.provider === 'email',
      descope_login_id: email,
    }
    const { error: upErr } = await adminClient.auth.admin.updateUserById(authUserId, {
      app_metadata: newMetadata,
    })
    if (upErr) {
      const msg = LOG_MESSAGES.RESOURCE.METADATA_UPDATE_FAILED
      logger.error(msg, upErr)
      return Forbidden({
        msg,
        details: upErr.message,
      }).toResponse()
    }
    logger.info(LOG_MESSAGES.RESOURCE.METADATA_UPDATE_COMPLETED)

    // Magic Link 発行（Admin）
    logger.info(LOG_MESSAGES.PROCESSING.MAGIC_LINK_GENERATION_STARTED)
    const { data: gen, error: genErr } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
    if (genErr) {
      const msg = LOG_MESSAGES.PROCESSING.MAGIC_LINK_GENERATION_FAILED
      logger.error(msg, genErr)
      return InternalError({
        msg,
        details: genErr.message,
      }).toResponse()
    }
    const tokenHash = gen?.properties?.hashed_token
    if (!tokenHash) {
      const msg = LOG_MESSAGES.PROCESSING.MAGIC_LINK_GENERATION_FAILED
      logger.error(msg, new Error('no_token_hash'))
      return InternalError({ msg }).toResponse()
    }
    logger.info(LOG_MESSAGES.PROCESSING.MAGIC_LINK_GENERATION_COMPLETED)

    // verifyOtp(token_hash) を「サーバーで」実行 → GoTrue セッション確立（Set-Cookie）
    logger.info(LOG_MESSAGES.AUTH.OTP_VERIFY_STARTED)
    const res = Success({ message: 'トークンをクッキーにセット完了' }).toResponse()
    const serverClient = await createServerComponentClient()

    // 初回直後の競合に備え簡単なリトライ
    let lastErr: AuthError | null = null
    for (let i = 0; i < 3; i++) {
      const { error } = await serverClient.auth.verifyOtp({
        type: 'email',
        token_hash: tokenHash,
      })
      if (!error) {
        logger.info(LOG_MESSAGES.AUTH.OTP_VERIFY_COMPLETED, {
          retryCount: i,
        })
        logger.info(LOG_MESSAGES.PROCESSING.COMPLETED)
        res.headers.set('Cache-Control', 'no-store')
        return res
      }
      lastErr = error
      logger.debug('OTP verification retry', { attempt: i + 1, error: error.message })

      await new Promise((r) => setTimeout(r, 150))
    }

    const msg = LOG_MESSAGES.AUTH.OTP_VERIFY_FAILED
    logger.error(msg, lastErr ?? new Error('verify_failed'))
    return Unauthorized({ msg, details: lastErr?.message }).toResponse()
  } catch (error) {
    const msg = LOG_MESSAGES.PROCESSING.UNEXPECTED_ERROR
    logger.error(msg, error)
    return InternalError({
      msg,
    }).toResponse()
  }
})
