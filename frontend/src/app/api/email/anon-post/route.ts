import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { InternalError, Success } from '@/lib/api/response'
import { createMailHTML } from '@/lib/api/utils'
const { RESEND_API_KEY, FROM_EMAIL, SUPPORT_EMAIL } = process.env

const resend = new Resend(RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    if (!FROM_EMAIL || !SUPPORT_EMAIL) {
      throw Error('from_email or support_email is missing')
    }

    // リクエストボディから送信先情報を取得
    const { pattern, emailTo } = await request.json()

    // React コンポーネントを HTML にレンダリング
    const { html, subject } = await createMailHTML({
      pattern,
      userName: emailTo,
      supportEmail: SUPPORT_EMAIL,
    })

    // Resend でメール送信
    await resend.emails.send({
      from: FROM_EMAIL,
      to: emailTo,
      subject,
      html,
    })

    return Success({ message: true }).toResponse()
  } catch (err) {
    console.error('mail sending error:', err)
    return InternalError({
      msg: 'Internal server error during sending mail',
    }).toResponse()
  }
}
