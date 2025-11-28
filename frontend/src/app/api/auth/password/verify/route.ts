import { NextRequest } from 'next/server'

import { BadRequest, InternalError, Success, Unauthorized } from '@/lib/api/response'
import { createClient } from '@supabase/supabase-js'
import { getAccessTokenFromHeader } from '@/lib/api/utils'
import { adminClient } from '@/lib/supabase/client/adminClient'
import { checkValidSessionLevel } from '@/lib/supabase/auth/server'

export async function POST(request: NextRequest) {
  try {
    // 認証ヘッダーからアクセストークンを取得
    const accessToken = getAccessTokenFromHeader(request)
    if (!accessToken) {
      return Unauthorized({ msg: 'Authorization header required' }).toResponse()
    }

    // アクセストークンからユーザー情報を取得
    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(accessToken)

    if (userError || !user) {
      return Unauthorized({ msg: 'Invalid access token' }).toResponse()
    }
    if (!user.email) {
      return Unauthorized({ msg: 'invalid user email' }).toResponse()
    }

    const { password } = await request.json()

    // 検証用の独立したクライアント（サーバーサイドなのでセッション干渉なし）
    const verificationClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // セッションレベルチェック
    const { valid } = await checkValidSessionLevel(user)
    if (!valid) {
      return Unauthorized({ msg: 'Invalid session level' }).toResponse()
    }

    const { error: signInError } = await verificationClient.auth.signInWithPassword({
      email: user.email,
      password: password,
    })
    if (signInError) {
      return BadRequest().toResponse()
    }

    return Success({ valid: true }).toResponse()
  } catch (err) {
    console.error('mail sending error:', err)
    return InternalError({
      msg: 'Internal server error during sending mail',
    }).toResponse()
  }
}
