// src/lib/supabase/auth/mfa.ts - 型安全性を向上
import { AuthMFAListFactorsResponse } from '@supabase/supabase-js'
import { browserClient } from '../client/browserClient'
import {
  totpSetupVerificationSchema,
  TotpSetupVerificationInput,
  TotpEnrollmentResponse,
  TotpSetupResponse,
  MfaFactor,
  GetAvailableMfaFactorsResponse,
  MfaType,
  TotpResetResponse,
  ListMfaResponse,
  MFA_TYPES,
} from './types'
import { AUTH_MESSAGES, AUTH_LOG_MESSAGES } from '@/lib/constants/auth'
import { ZodError } from 'zod'

// 移行の処理はSupabaseのクライアントSDKを使用しており、裏側でJWT検証をしてるのでフロント側から呼び出しても問題ない

/**
 * TOTP　Enroll処理
 */
export async function enrollTotpFactor(): Promise<TotpEnrollmentResponse> {
  try {
    const { data: user } = await browserClient.auth.getUser()
    if (!user.user) {
      return {
        success: false,
        message: AUTH_MESSAGES.USER_NOT_AUTHENTICATED,
      }
    }

    console.log(AUTH_LOG_MESSAGES.MFA_ENROLLMENT_ATTEMPT)

    // #region TOTP Enroll処理の詳細
    // TOTP登録（enroll）の裏側処理：
    // 1. Base32エンコードされた32文字の秘密鍵を生成
    // 2. TOTP URI構築
    // 3. 秘密鍵をQRコード（SVG）として生成
    // 4. auth.mfa_factors テーブルに factor レコード作成
    // -- auth.mfa_factors テーブル
    // {
    //   id: "550e8400-e29b-41d4-a716-446655440000", -- これがenrollData.id
    //   user_id: "user_uuid",
    //   factor_type: "totp",
    //   status: "unverified", -- 初期状態
    //   secret: "暗号化された秘密鍵",
    //   created_at: "2024-01-01T00:00:00Z"
    // }
    // 5. 秘密鍵は暗号化してSupabaseに保存
    // #endregion
    const { data: factorData, error: factorError } = await browserClient.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `${user.user.email}'s TOTP`,
    })
    if (factorError) {
      console.error(AUTH_LOG_MESSAGES.MFA_ENROLLMENT_FAILED, factorError.message)
      return {
        success: false,
        message: AUTH_MESSAGES.TOTP_SETUP_FAILED,
      }
    }

    console.log(AUTH_LOG_MESSAGES.MFA_ENROLLMENT_SUCCESS)

    return {
      success: true,
      message: AUTH_MESSAGES.TOTP_ENROLLMENT_SUCCESS,
      qrCode: factorData.totp?.qr_code,
      secret: factorData.totp?.secret,
      factorId: factorData.id,
    }
  } catch (error) {
    console.error(AUTH_LOG_MESSAGES.UNEXPECTED_MFA_ERROR, error)
    return {
      success: false,
      message: AUTH_MESSAGES.UNEXPECTED_ERROR,
    }
  }
}

/**
 * TOTP検証
 */
export async function verifyTotp(
  input: TotpSetupVerificationInput,
): Promise<TotpSetupResponse> {
  try {
    // バリデーション
    const validatedInput = totpSetupVerificationSchema.parse(input)
    const { factorId, totpCode } = validatedInput

    // #region Challenge処理の詳細
    // Challenge（チャレンジ）の裏側処理：
    // 1. 一意のChallenge IDを生成（UUID形式）
    // 2. タイムスタンプを記録（有効期限管理：通常5分程度）
    // 3. Challenge状態をデータベースに保存
    // -- auth.mfa_challenges テーブル（推定）
    // {
    //   id: "challenge_uuid", -- challengeData.id
    //   factor_id: "factor_uuid", -- 対応するfactor
    //   created_at: "2024-01-01T00:00:00Z",
    //   expires_at: "2024-01-01T00:05:00Z", -- 通常5分程度
    //   verified_at: null, -- 未検証状態
    //   ip_address: "xxx.xxx.xxx.xxx"
    // }
    //
    // セキュリティ上の重要性：
    // - ワンタイム使用: 1つのChallengeは1回のみ有効
    // - 短時間有効: 通常5分程度で期限切れ
    // - Factor紐付け: 特定のTOTP要素にのみ有効
    // - リプレイ攻撃防止: 同じコードの再利用を防ぐ
    // #endregion
    const { data: challengeData, error: challengeError } =
      await browserClient.auth.mfa.challenge({
        factorId: factorId,
      })
    if (challengeError) {
      console.error(AUTH_LOG_MESSAGES.MFA_CHALLENGE_FAILED, challengeError.message)
      return {
        success: false,
        message: AUTH_MESSAGES.TOTP_SETUP_VERIFICATION_FAILED,
      }
    }

    // #region Verify処理の詳細
    //　Supabaseのauth.usersにてTOTPが必要であることが登録される
    // Verify（検証）の裏側処理：
    // 1. Challenge の検証
    //    - Challenge IDの存在確認
    //    - 使用済み・期限切れチェック
    // 2. TOTP コードの検証
    //    - データベースから暗号化された秘密鍵を取得・復号化
    //    - 現在時刻(30秒間隔)でTOTPコード生成
    //    - ユーザー入力コードと比較（前後の時間窓も考慮）
    // 3. Factor の状態更新
    //    - auth.mfa_factors テーブルの status を 'verified' に更新
    // 4. Challenge の使用済み記録
    //    - auth.mfa_challenges テーブルの verified_at に現在時刻を記録
    // 5. AAL2 セッション生成
    //    - 新しいJWTトークン生成（aal: "aal2", amr: ["password", "totp"]）
    //    - refresh_token も含む完全なセッション情報
    // #endregion
    const { data: verifyData, error: verifyError } = await browserClient.auth.mfa.verify({
      factorId: factorId,
      challengeId: challengeData.id,
      code: totpCode,
    })
    if (verifyError) {
      console.error(AUTH_LOG_MESSAGES.MFA_SETUP_VERIFICATION_FAILED, verifyError.message)
      return {
        success: false,
        message: AUTH_MESSAGES.TOTP_CODE_INVALID,
      }
    }

    return {
      success: true,
      message: AUTH_MESSAGES.TOTP_SETUP_SUCCESS,
      verify_data: {
        access_token: verifyData.access_token,
        refresh_token: verifyData.refresh_token,
      },
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        message: error.errors[0]?.message || AUTH_MESSAGES.VALIDATION_ERROR,
      }
    }

    console.error(AUTH_LOG_MESSAGES.UNEXPECTED_MFA_ERROR, error)
    return {
      success: false,
      message: AUTH_MESSAGES.UNEXPECTED_ERROR,
    }
  }
}

/**
 * 利用可能なMFAファクターの取得
 */
export async function getAvailableMfaFactors(): Promise<GetAvailableMfaFactorsResponse> {
  try {
    const { data: factors, error } = await browserClient.auth.mfa.listFactors()
    if (error) {
      console.error('❌ [MFA] Failed to get factors:', error.message)
      return {
        success: false,
        message: 'MFA設定の取得に失敗しました',
      }
    }

    // Supabaseの形式から汎用的な形式に変換
    const mfaFactors = convertMfaFactors(factors)

    return {
      success: true,
      message: 'MFA設定を取得しました',
      factors: mfaFactors,
    }
  } catch (error) {
    console.error(AUTH_LOG_MESSAGES.UNEXPECTED_MFA_ERROR, error)
    return {
      success: false,
      message: AUTH_MESSAGES.UNEXPECTED_ERROR,
    }
  }
}

/**
 * 　Enrollリセット処理（すべての TOTP factor を削除）
 */
export async function resetEnrollment(
  type: MfaType,
  status?: 'verified' | 'unverified',
): Promise<TotpResetResponse> {
  try {
    // 1. 認証チェック
    const { data: user } = await browserClient.auth.getUser()
    if (!user.user) {
      return {
        success: false,
        message: AUTH_MESSAGES.USER_NOT_AUTHENTICATED,
      }
    }

    // 2. 現在登録中の MFA 要素を取得
    const { data: factors, error: listError } = await browserClient.auth.mfa.listFactors()
    if (listError) {
      return {
        success: false,
        message: listError.message,
      }
    }

    // 3. 指定したMFAタイプで未認証のものを抽出
    const allFactors = factors.all
    const targetFactors = allFactors.filter(
      (f) => f.status === status && f.factor_type === type,
    )
    if (targetFactors.length === 0) {
      return {
        success: true,
        message: 'Not found enrollment',
      }
    }

    // 4. MFAファクターエンロールを削除
    for (const factor of targetFactors) {
      const { error: unenrollErr } = await browserClient.auth.mfa.unenroll({
        factorId: factor.id,
      })
      if (unenrollErr) {
        return {
          success: false,
          message: 'Fail Unverified enrollment',
        }
      }
    }

    return {
      success: true,
      message: 'Success Unverified enrollment',
    }
  } catch (error) {
    console.error(AUTH_LOG_MESSAGES.UNEXPECTED_MFA_ERROR, error)
    return {
      success: false,
      message: AUTH_MESSAGES.UNEXPECTED_ERROR,
    }
  }
}

/**
 * 　mfa一覧を取得
 */
export async function listMfa(): Promise<ListMfaResponse> {
  try {
    // 認証チェック
    const { data: user } = await browserClient.auth.getUser()
    if (!user.user) {
      return {
        success: false,
        error: AUTH_MESSAGES.USER_NOT_AUTHENTICATED,
      }
    }

    // MFA ファクター一覧を取得
    const { data: factors, error: listErr } = await browserClient.auth.mfa.listFactors()
    if (listErr) {
      return {
        success: false,
        error: listErr.message,
      }
    }

    return { success: true, data: [...factors.all, ...factors.phone, ...factors.totp] }
  } catch (error) {
    console.error(AUTH_LOG_MESSAGES.UNEXPECTED_MFA_ERROR, error)
    return {
      success: false,
      error: AUTH_MESSAGES.UNEXPECTED_ERROR,
    }
  }
}

/**
 * 　Supabase形式のmfaをアプリで使いやすい形式に変換
 */
export function convertMfaFactors(
  factors: AuthMFAListFactorsResponse['data'],
): MfaFactor[] {
  const mfaFactors: MfaFactor[] = []

  // TOTP factors
  if (factors?.totp) {
    factors.totp.forEach((factor) => {
      if (factor.status === 'verified') {
        mfaFactors.push({
          id: factor.id,
          type: MFA_TYPES.TOTP,
          status: factor.status,
          friendlyName: factor.friendly_name || 'TOTP認証',
          createdAt: factor.created_at,
        })
      }
    })
  }

  // SMS factors（将来的）
  if (factors?.phone) {
    factors.phone.forEach((factor) => {
      if (factor.status === 'verified') {
        mfaFactors.push({
          id: factor.id,
          type: MFA_TYPES.SMS,
          status: factor.status,
          friendlyName: factor.friendly_name || 'SMS認証',
          createdAt: factor.created_at,
        })
      }
    })
  }

  return mfaFactors
}
