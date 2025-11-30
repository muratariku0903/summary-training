import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { InternalError, Success } from '@/lib/api/response'
import { createMailHTML } from '@/lib/api/utils'
import { createServerComponentClient } from '@/lib/supabase/client/serverComponentClient'
import { withAuth, withLogger } from '@/lib/api/wrapper'
import { LOG_MESSAGES } from '@/lib/api/errorCodes'

const { RESEND_API_KEY, FROM_EMAIL, SUPPORT_EMAIL } = process.env

const resend = new Resend(RESEND_API_KEY)

export const POST = withLogger(
  withAuth(async (req: NextRequest, user, { logger }) => {
    logger.info(LOG_MESSAGES.PROCESSING.EMAIL_SEND_STARTED)

    try {
      // 環境変数チェック
      if (!FROM_EMAIL || !SUPPORT_EMAIL) {
        const msg = LOG_MESSAGES.PROCESSING.ENV_VARS_MISSING
        logger.error(msg, new Error('from_email or support_email is missing'), {
          hasFromEmail: !!FROM_EMAIL,
          hasSupportEmail: !!SUPPORT_EMAIL,
        })
        return InternalError({ msg }).toResponse()
      }

      // ユーザーメールアドレスチェック
      const { email } = user
      if (!email) {
        const msg = LOG_MESSAGES.PROCESSING.USER_EMAIL_MISSING
        logger.error(msg, new Error('user email is missing'))
        return InternalError({ msg }).toResponse()
      }

      logger.setContext({ email })

      // ユーザープロフィール取得
      logger.info(LOG_MESSAGES.RESOURCE.USER_PROFILE_FETCH_STARTED)
      const client = await createServerComponentClient()
      const { data: userData, error: profileError } = await client
        .from('user_profiles')
        .select()
        .single()

      if (profileError) {
        const msg = LOG_MESSAGES.RESOURCE.USER_PROFILE_FETCH_FAILED
        logger.error(msg, profileError)
        return InternalError({
          msg,
        }).toResponse()
      }

      const { user_name, display_name } = userData
      logger.info(LOG_MESSAGES.RESOURCE.USER_PROFILE_FETCH_COMPLETED, {
        hasUserName: !!user_name,
        hasDisplayName: !!display_name,
      })

      // リクエストボディからメールパターンを取得
      const { pattern } = await req.json()
      logger.setContext({ emailPattern: pattern })

      // メールHTML生成
      logger.info(LOG_MESSAGES.PROCESSING.EMAIL_HTML_GENERATION_STARTED)
      const { html, subject } = await createMailHTML({
        pattern,
        userName: user_name ?? display_name ?? email,
        supportEmail: SUPPORT_EMAIL,
      })
      logger.info(LOG_MESSAGES.PROCESSING.EMAIL_HTML_GENERATION_COMPLETED, {
        subject,
      })

      // メール送信
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject,
        html,
      })

      logger.info(LOG_MESSAGES.PROCESSING.EMAIL_SEND_COMPLETED, {
        to: email,
        subject,
      })

      return Success({ message: true }).toResponse()
    } catch (error) {
      const msg = LOG_MESSAGES.PROCESSING.EMAIL_SEND_FAILED
      logger.error(msg, error)
      return InternalError({
        msg,
      }).toResponse()
    }
  }),
)
