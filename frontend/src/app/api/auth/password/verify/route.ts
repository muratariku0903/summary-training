import { BadRequest, InternalError, Success, Unauthorized } from '@/lib/api/response'
import { createClient } from '@supabase/supabase-js'
import { checkValidSessionLevel } from '@/lib/supabase/auth/server'
import { withAuth, withLogger } from '@/lib/api/wrapper'
import { LOG_MESSAGES } from '@/lib/api/errorCodes'

export const POST = withLogger(
  withAuth(async (request, user, { logger }) => {
    try {
      logger.info(LOG_MESSAGES.PROCESSING.STARTED)

      const { password } = await request.json()

      // 検証用の独立したクライアント（サーバーサイドなのでセッション干渉なし）
      const verificationClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      // セッションレベルチェック
      logger.debug('Checking session level')
      const { valid } = await checkValidSessionLevel(user)
      if (!valid) {
        logger.warn(LOG_MESSAGES.AUTH.INVALID_SESSION_LEVEL, {
          userId: user.id,
        })
        return Unauthorized({
          msg: LOG_MESSAGES.AUTH.INVALID_SESSION_LEVEL,
        }).toResponse()
      }
      logger.debug('Session level valid')

      // パスワード検証
      logger.debug('Verifying password')
      const { error: signInError } = await verificationClient.auth.signInWithPassword({
        email: user.email ?? '',
        password: password,
      })
      if (signInError) {
        logger.warn('Password verification failed', {
          errorCode: signInError.code,
        })
        return BadRequest().toResponse()
      }

      logger.info('Password verified successfully')
      return Success({ valid: true }).toResponse()
    } catch (err) {
      logger.error(LOG_MESSAGES.PROCESSING.UNEXPECTED_ERROR, err)
      return InternalError({
        msg: LOG_MESSAGES.PROCESSING.UNEXPECTED_ERROR,
        details: err,
      }).toResponse()
    }
  }),
)
