// src/lib/constants/auth.ts
/**
 * 認証関連のメッセージ定数
 */
export const AUTH_MESSAGES = {
  // 成功メッセージ
  SIGNIN_SUCCESS: 'ログインが完了しました',
  SIGNIN_MFA_REQUIRED: '基本認証が完了しました。2段階認証コードを入力してください。',
  SIGNUP_SUCCESS: '確認メールを送信しました。メールボックスをご確認ください。',
  SIGNOUT_SUCCESS: 'ログアウトしました',
  TOTP_VERIFICATION_SUCCESS: '2段階認証が完了しました',
  TOTP_SETUP_SUCCESS: 'TOTP設定が完了しました',
  TOTP_ENROLLMENT_SUCCESS: 'TOTP設定を開始しました',
  CHANGE_PASSWORD_SUCCESS: 'パスワード変更が完了しました',
  CHANGE_EMAIL_SUCCESS: 'メールアドレス変更が完了しました',
  RESET_PASSWORD_SUCCESS: 'パスワードリセットが完了しました',

  // エラーメッセージ
  AUTH_FAILED: '認証に失敗しました',
  SIGNUP_FAILED: '登録に失敗しました',
  SIGNIN_FAILED: 'ログインに失敗しました',
  SIGNOUT_FAILED: 'ログアウトに失敗しました',
  MFA_CHECK_FAILED: 'MFA設定の確認に失敗しました',
  TOTP_VERIFICATION_FAILED: 'TOTP認証に失敗しました',
  TOTP_SETUP_FAILED: 'TOTP設定の開始に失敗しました',
  TOTP_SETUP_VERIFICATION_FAILED: 'TOTP設定の確認に失敗しました',
  TOTP_CODE_INVALID: 'TOTPコードが正しくありません',
  TOTP_CODE_FORMAT_ERROR: 'TOTPコードは6桁で入力してください',
  USER_NOT_AUTHENTICATED: 'ユーザーが認証されていません',
  GET_MFA_FACTORS_FAILED: 'MFAFactorの取得の失敗しました',
  CHANGE_PASSWORD_FAILED: 'パスワード変更に失敗しました',
  CHANGE_PASSWORD_FAILED_WITH_CURRENT_PASSWORD:
    'パスワード変更に失敗しました（既存のパスワードが不正）',
  CHANGE_EMAIL_FAILED: 'メールアドレス変更に失敗しました',
  RESET_PASSWORD_FAILED: 'パスワードリセットに失敗しました',

  // 汎用エラーメッセージ
  VALIDATION_ERROR: 'バリデーションエラー',
  UNEXPECTED_ERROR: '予期しないエラーが発生しました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
} as const

/**
 * バリデーションエラーメッセージ
 */
export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'メールアドレスを入力してください',
  EMAIL_INVALID: 'メール形式で入力してください',
  PASSWORD_REQUIRED: 'パスワードを入力してください',
  PASSWORD_MIN_LENGTH: '8文字以上で入力してください',
  PASSWORD_UPPERCASE: '大文字を1文字以上含めてください',
  PASSWORD_LOWERCASE: '小文字を1文字以上含めてください',
  PASSWORD_NUMBER: '数字を1文字以上含めてください',
  PASSWORD_MISMATCH: 'パスワードが一致しません',
  USERNAME_REQUIRED: 'ユーザー名を入力してください',
  USERNAME_MIN_LENGTH: '2文字以上で入力してください',
  TOTP_CODE_REQUIRED: 'TOTPコードを入力してください',
  TOTP_CODE_LENGTH: 'TOTPコードは6桁で入力してください',
  TOTP_CODE_FORMAT: 'TOTPコードは6桁の数字で入力してください',
  CHALLENGE_ID_REQUIRED: 'チャレンジIDが必要です',
  CHALLENGE_ID_INVALID: 'チャレンジIDが無効です',
  FACTOR_ID_REQUIRED: 'ファクターIDが必要です',
  FACTOR_ID_INVALID: 'ファクターIDが無効です',
} as const

/**
 * 認証ログメッセージ
 */
export const AUTH_LOG_MESSAGES = {
  SIGNIN_ATTEMPT: '🔐 [AUTH] Attempting signin for:',
  SIGNIN_SUCCESS: '✅ [AUTH] Signin successful for user:',
  SIGNIN_ERROR: '❌ [AUTH] Signin error:',
  SIGNUP_ATTEMPT: '📝 [AUTH] Attempting signup for:',
  SIGNUP_SUCCESS: '✅ [AUTH] Signup successful, confirmation email sent',
  SIGNUP_ERROR: '❌ [AUTH] Signup error:',
  SIGNOUT_ATTEMPT: '🚪 [AUTH] Signing out',
  SIGNOUT_SUCCESS: '✅ [AUTH] Signout successful',
  SIGNOUT_ERROR: '❌ [AUTH] Signout error:',
  CHANGE_PASSWORD_ATTEMPT: '🚪 [AUTH] change password',
  CHANGE_PASSWORD_SUCCESS: '✅ [AUTH] change password successful',
  CHANGE_PASSWORD_ERROR: '❌ [AUTH] change password error:',
  CHANGE_EMAIL_ATTEMPT: '🚪 [AUTH] change email',
  CHANGE_EMAIL_SUCCESS: '✅ [AUTH] change email successful',
  CHANGE_EMAIL_ERROR: '❌ [AUTH] change email error:',
  RESET_PASSWORD_ATTEMPT: '🚪 [AUTH] reset password',
  RESET_PASSWORD_SUCCESS: '✅ [AUTH] reset password successful',
  RESET_PASSWORD_ERROR: '❌ [AUTH] reset password error:',
  MFA_REQUIRED: '🔐 [AUTH] TOTP required',
  MFA_CHALLENGE_FAILED: '❌ [AUTH] Challenge creation failed:',
  MFA_VERIFICATION_ATTEMPT: '🔐 [MFA] Verifying TOTP code',
  MFA_VERIFICATION_SUCCESS: '✅ [MFA] TOTP verification successful',
  MFA_VERIFICATION_FAILED: '❌ [MFA] TOTP verification failed:',
  MFA_ENROLLMENT_ATTEMPT: '🔐 [MFA] Enrolling TOTP factor',
  MFA_ENROLLMENT_SUCCESS: '✅ [MFA] TOTP factor enrolled',
  MFA_ENROLLMENT_FAILED: '❌ [MFA] TOTP enrollment failed:',
  MFA_SETUP_VERIFICATION_ATTEMPT: '🔐 [MFA] Verifying TOTP setup',
  MFA_SETUP_VERIFICATION_SUCCESS: '✅ [MFA] TOTP setup completed',
  MFA_SETUP_VERIFICATION_FAILED: '❌ [MFA] TOTP setup verification failed:',
  SESSION_GET_ERROR: '❌ [SESSION] Get session error:',
  SESSION_GET_USER_ERROR: '❌ [SESSION] Get user error:',
  UNEXPECTED_ERROR: '❌ [AUTH] Unexpected error:',
  UNEXPECTED_SIGNIN_ERROR: '❌ [AUTH] Unexpected signin error:',
  UNEXPECTED_SIGNUP_ERROR: '❌ [AUTH] Unexpected signup error:',
  UNEXPECTED_SIGNOUT_ERROR: '❌ [AUTH] Unexpected signout error:',
  UNEXPECTED_MFA_ERROR: '❌ [MFA] Unexpected error:',
  UNEXPECTED_SESSION_ERROR: '❌ [SESSION] Unexpected error:',
} as const

// MFA方式の定義
export const MFA_TYPES = {
  TOTP: 'totp',
  SMS: 'phone',
} as const
