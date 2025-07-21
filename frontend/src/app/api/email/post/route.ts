import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { InternalError, Success, Unauthorized } from '@/lib/api/response'
import { createMailHTML, getAccessTokenFromHeader } from '@/lib/api/utils'
import { createClient } from '@/lib/supabase/client/serverComponentClient'
const { RESEND_API_KEY, FROM_EMAIL, SUPPORT_EMAIL } = process.env

const resend = new Resend(RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    if (!FROM_EMAIL || !SUPPORT_EMAIL) {
      throw Error('from_email or support_email is missing')
    }

    // 認証ヘッダーからアクセストークンを取得
    const accessToken = getAccessTokenFromHeader(request)
    if (!accessToken) {
      console.error('❌ [DELETE-USER] No valid authorization header')
      return Unauthorized('Authorization header required').toResponse()
    }

    // supabaseクライアント生成
    const client = await createClient()

    // アクセストークンからユーザー情報を取得
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser(accessToken)
    if (userError || !user) {
      console.error('❌ [DELETE-USER] Invalid access token:', userError?.message)
      return Unauthorized('Invalid access token').toResponse()
    }
    const { email } = user
    if (!email) {
      throw Error('user email is missing')
    }

    const { data: userData, error } = await client.from('user_profiles').select().single()
    if (error) {
      console.error('Profile fetch error:', error)
      return InternalError('Internal server error during fetching user data').toResponse()
    }
    const { user_name, display_name } = userData

    // リクエストボディから送信先情報を取得
    const { pattern } = await request.json()

    // React コンポーネントを HTML にレンダリング
    const { html, subject } = await createMailHTML({
      pattern,
      userName: user_name ?? display_name ?? email,
      supportEmail: SUPPORT_EMAIL,
    })

    // Resend でメール送信
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    })

    return Success({ message: true }).toResponse()
  } catch (err) {
    console.error('mail sending error:', err)
    return InternalError('Internal server error during sending mail').toResponse()
  }
}
