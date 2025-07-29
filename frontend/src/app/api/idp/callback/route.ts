import {
  Conflict,
  Forbidden,
  InternalError,
  Success,
  Unauthorized,
} from '@/lib/api/response'
import { verifyDescopeToken } from '@/lib/descope/verifyDescopeToken'
import { adminClient } from '@/lib/supabase/client/adminClient'
import { createClient } from '@/lib/supabase/client/serverComponentClient'
import { ensureShadowUser } from '@/lib/supabase/idp/ensureShadowUser'
import { AuthError } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request): Promise<NextResponse> {
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

  // 2) Descope JWT 検証（JWKS / iss / aud / exp / alg）
  const {
    success: verifySuccess,
    claims,
    message: verifyErrorMessage,
  } = await verifyDescopeToken(idpToken)
  if (!verifySuccess) {
    return Unauthorized(
      'Internal server error during verify descope token',
      verifyErrorMessage,
    ).toResponse()
  }

  // 3) メール条件：verifiedのみOK（未検証は409でオンボーディングへ）
  const email = typeof claims.email === 'string' ? claims.email : undefined
  if (!email || !claims.email_verified) {
    return Conflict('email_onboarding_required').toResponse()
  }

  // 4) シャドーユーザー確保（リンク表 → 既存探索 → 作成 → リンク作成）
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
    console.log(code)
    return InternalError(
      'Internal server error during ensure shadow user',
      ensureErrorMessage,
    ).toResponse()
  }

  // --- 5) Passkey認証の判別をするためにメタデータにプロバイダ情報として「descope」をセット ---
  // Providerがemail以外のものであれば、custom_providerとして「　descope」をセット
  const { data: u } = await adminClient.auth.admin.getUserById(authUserId)
  const metadata = u.user?.app_metadata
  if (metadata?.provider !== 'email') {
    const { error: upErr } = await adminClient.auth.admin.updateUserById(authUserId, {
      app_metadata: {
        ...metadata,
        email_primary_provider: false,
        descope_login_id: email,
      },
    })
    if (upErr) {
      return Forbidden(
        'Forbidden error during update user metadata',
        upErr.message,
      ).toResponse()
    }
  }

  // --- 6) Magic Link 発行（Admin） ---
  const { data: gen, error: genErr } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (genErr) {
    return InternalError('gen_link_failed', genErr.message).toResponse()
  }
  const tokenHash = gen?.properties?.hashed_token
  if (!tokenHash) {
    return InternalError('no_token_hash').toResponse()
  }

  // --- 6) verifyOtp(token_hash) を「サーバーで」実行 → GoTrue セッション確立（Set-Cookie） ---
  // @supabase/ssr を使って、Route のレスポンスへ Set-Cookie を書き込みます
  const res = Success({
    message: 'Supabase互換JWTをHttpOnlyクッキーにセット完了',
  }).toResponse()
  const serverClient = await createClient()

  // 初回直後の競合に備え簡単なリトライ
  let lastErr: AuthError | null = null
  for (let i = 0; i < 3; i++) {
    const { error } = await serverClient.auth.verifyOtp({
      type: 'email',
      token_hash: tokenHash,
    })
    if (!error) {
      res.headers.set('Cache-Control', 'no-store')
      return res // ← ここで access/refresh のクッキーがレスポンスに載る
    }
    lastErr = error

    await new Promise((r) => setTimeout(r, 150))
  }

  return Unauthorized('verify_failed', lastErr?.message).toResponse()
}
