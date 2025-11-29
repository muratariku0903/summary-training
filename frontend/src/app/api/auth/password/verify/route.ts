import { BadRequest, InternalError, Success, Unauthorized } from '@/lib/api/response'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/api/utils'
import { checkValidSessionLevel } from '@/lib/supabase/auth/server'
import { DETAILED_ERROR_MESSAGES } from '@/lib/api/errorCodes'

export const POST = withAuth(async (request, user) => {
  try {
    const { password } = await request.json()

    // 検証用の独立したクライアント（サーバーサイドなのでセッション干渉なし）
    const verificationClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // セッションレベルチェック
    const { valid } = await checkValidSessionLevel(user)
    if (!valid) {
      return Unauthorized({
        msg: DETAILED_ERROR_MESSAGES.AUTH.INVALID_SESSION_LEVEL,
      }).toResponse()
    }

    const { error: signInError } = await verificationClient.auth.signInWithPassword({
      email: user.email ?? '',
      password: password,
    })
    if (signInError) {
      return BadRequest().toResponse()
    }

    return Success({ valid: true }).toResponse()
  } catch (err) {
    console.error(DETAILED_ERROR_MESSAGES.PROCESSING.UNEXPECTED_ERROR, err)
    return InternalError({
      msg: DETAILED_ERROR_MESSAGES.PROCESSING.UNEXPECTED_ERROR,
      details: err,
    }).toResponse()
  }
})
