import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { InternalError, Success } from '@/lib/api/response'
import { createMailHTML } from '@/lib/api/utils'
import { withLogger } from '@/lib/api/wrapper'
import { LOG_MESSAGES } from '@/lib/log/message'

const { RESEND_API_KEY, FROM_EMAIL, SUPPORT_EMAIL } = process.env

const resend = new Resend(RESEND_API_KEY)

export const POST = withLogger(async (request: NextRequest, { logger }) => {
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

    // リクエストボディから送信先情報を取得
    const { pattern, emailTo } = await request.json()

    // 匿名APIなのでメールアドレスのみをコンテキストに設定（注意して扱う）
    logger.setContext({
      emailPattern: pattern,
      recipientDomain: emailTo?.split('@')[1], // ドメインのみを記録
    })

    // メールHTML生成
    logger.info(LOG_MESSAGES.PROCESSING.EMAIL_HTML_GENERATION_STARTED)
    const { html, subject } = await createMailHTML({
      pattern,
      userName: emailTo,
      supportEmail: SUPPORT_EMAIL,
    })
    logger.info(LOG_MESSAGES.PROCESSING.EMAIL_HTML_GENERATION_COMPLETED, {
      subject,
    })

    // メール送信
    await resend.emails.send({
      from: FROM_EMAIL,
      to: emailTo,
      subject,
      html,
    })

    logger.info(LOG_MESSAGES.PROCESSING.EMAIL_SEND_COMPLETED, {
      recipientDomain: emailTo?.split('@')[1],
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
})
