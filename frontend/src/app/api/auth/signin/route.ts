import { NextRequest, NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/serverClient'
import { z } from 'zod'
import {
  BadRequest,
  Success,
  InternalError,
  Unauthor,
  Successized,
} from '@/lib/api/response'

export const requestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const responseSchema = z.object({
  userId: z.string(),
  requiresMfa: z.boolean(),
  message: z.string(),
  temporaryToken: z.string().optional(), // TOTP検証用の一時トークン
})

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json()
    const parse = requestSchema.safeParse(body)
    if (!parse.success) {
      return BadRequest('Invalid payload', parse.error).toResponse()
    }
    const { email, password } = parse.data

    // 🔑 基本認証（メール + パスワード）
    console.log('🔐 [SIGNIN-STEP1] Attempting basic auth for:', email)
    const { data: authData, error: authError } =
      await serverClient.auth.signInWithPassword({
        email,
        password,
      })
    if (authError) {
      console.error('❌ [SIGNIN-STEP1] Auth error:', authError.message)
      return Unauthorized('Invalid credentials', authError.message).toResponse()
    }
    const user = authData.user
    console.log('✅ [SIGNIN-STEP1] Basic auth successful for user:', user.id)

    // 🔍 TOTP設定の確認
    const { data: factors, error: factorsError } =
      await serverClient.auth.mfa.listFactors()
    if (factorsError) {
      console.error(
        '⚠️ [SIGNIN-STEP1] Could not check MFA factors:',
        factorsError.message
      )
      // MFA確認できない場合は通常ログインとして処理
    }

    // アクティブなTOTP factorを確認
    const activeTotpFactor = factors?.totp?.find((factor) => factor.status === 'verified')
    if (activeTotpFactor) {
      console.log('🔐 [SIGNIN-STEP1] TOTP required for user:', user.id)

      // TOTP検証が必要 - 一時的なトークンを生成
      const temporaryToken = Buffer.from(
        JSON.stringify({
          userId: user.id,
          factorId: activeTotpFactor.id,
          timestamp: Date.now(),
          expiresAt: Date.now() + 5 * 60 * 1000, // 5分後に期限切れ
        })
      ).toString('base64')

      return Success({
        userId: user.id,
        requiresMfa: true,
        message: 'Basic authentication successful. TOTP verification required.',
        temporaryToken,
      }).toResponse()
    }

    // TOTP未設定の場合は通常ログイン完了
    console.log('✅ [SIGNIN-STEP1] Login successful without MFA for user:', user.id)

    return Success({
      userId: user.id,
      requiresMfa: false,
      message: 'Authentication successful',
    }).toResponse()
  } catch (e) {
    console.error('❌ [SIGNIN-STEP1] Unexpected error:', e)
    return InternalError('Internal server error').toResponse()
  }
}
