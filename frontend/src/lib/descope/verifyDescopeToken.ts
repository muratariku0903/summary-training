// npm i jose
import {
  createRemoteJWKSet,
  jwtVerify,
  JWTPayload,
  JWTHeaderParameters,
  errors as JoseErrors,
} from 'jose'

export type IdpClaims = {
  sub: string
  email?: string
  email_verified?: boolean
  // 必要なら他クレームも参照可能（payloadは保持しない設計でもOK）
}

export type VerifyOk = {
  success: true
  claims: IdpClaims
  header: JWTHeaderParameters
  code?: never
  message?: never
}

export type VerifyErrCode =
  | 'invalid_format' // 3ピースのJWTでない等
  | 'env_missing' // 必須env不足
  | 'jwks_fetch_error' // JWKS取得失敗
  | 'signature_invalid' // 署名不正/JWT無効
  | 'token_expired' // exp切れ
  | 'wrong_issuer' // iss不一致
  | 'wrong_audience' // aud不一致
  | 'alg_not_allowed' // 許可していないalg
  | 'sub_missing' // subなし
  | 'unknown' // その他

export type VerifyErr = {
  success: false
  claims?: never
  header?: never
  code: VerifyErrCode
  message: string
}

export type VerifyResult = VerifyOk | VerifyErr

/**
 * DescopeのJWTを検証し、必要クレームを返します
 */
export async function verifyDescopeToken(idpToken: string): Promise<VerifyResult> {
  // 1) 形式 & env
  if (!idpToken || typeof idpToken !== 'string' || idpToken.split('.').length !== 3) {
    return { success: false, code: 'invalid_format', message: 'Token must be a JWT' }
  }

  const ISSUER = process.env.DESCOPE_ISSUER
  const AUDIENCE = process.env.DESCOPE_AUDIENCE
  const JWKS_URI = process.env.DESCOPE_JWKS_URI
  if (!ISSUER || !AUDIENCE || !JWKS_URI) {
    return { success: false, code: 'env_missing', message: 'Missing DESCOPE_* envs' }
  }

  try {
    // 2) 署名+標準クレーム検証
    const jwks = getJwks(JWKS_URI)
    const { payload, protectedHeader } = await jwtVerify(idpToken, jwks, {
      issuer: ISSUER,
      algorithms: ['RS256', 'ES256'], // 許可algを限定
      clockTolerance: 5, // 秒
    })

    // typチェック（任意）
    if (protectedHeader?.typ && protectedHeader.typ !== 'JWT') {
      return { success: false, code: 'invalid_format', message: 'Invalid token typ' }
    }

    // 3) 必須クレーム
    if (!payload.sub) {
      return { success: false, code: 'sub_missing', message: 'sub is missing' }
    }

    // 4) 抽出・正規化
    const email =
      typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : undefined

    const claims: IdpClaims = {
      sub: String(payload.sub),
      email,
      email_verified: Boolean((payload as JWTPayload).email_verified),
    }

    return { success: true, claims, header: protectedHeader }
  } catch (e: unknown) {
    // joseのエラーをコードにマッピング
    if (e instanceof JoseErrors.JWTExpired) {
      return { success: false, code: 'token_expired', message: e.message }
    }
    if (e instanceof JoseErrors.JWSInvalid || e instanceof JoseErrors.JWTInvalid) {
      return { success: false, code: 'signature_invalid', message: e.message }
    }
    if (e instanceof JoseErrors.JWTClaimValidationFailed) {
      if (e.claim === 'iss')
        return { success: false, code: 'wrong_issuer', message: e.message }
      if (e.claim === 'aud')
        return { success: false, code: 'wrong_audience', message: e.message }
      return { success: false, code: 'unknown', message: e.message }
    }
    if (e instanceof TypeError) {
      // fetch失敗等（JWKS到達不可など）
      return { success: false, code: 'jwks_fetch_error', message: e.message }
    }
    return { success: false, code: 'unknown', message: 'verify failed' }
  }
}

// ---- 内部：JWKS（公開鍵のセット）をメモ化（envが変わったら再構築） ----
let _jwksUri: string | null = null
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null
function getJwks(jwksUri: string) {
  if (!_jwks || _jwksUri !== jwksUri) {
    _jwks = createRemoteJWKSet(new URL(jwksUri))
    _jwksUri = jwksUri
  }
  return _jwks
}
