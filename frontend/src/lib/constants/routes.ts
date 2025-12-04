export const PUBLIC_PATHS = {
  HOME: '/',
  SIGNIN: '/signin',
  SIGNIN_PASSKEY: '/signin/passkey',
  SIGNUP: '/signup',
  CALLBACK: '/callback',
  PASSWORD_RESET: '/password-reset',
  PASSWORD_RESET_CALLBACK: '/password-reset-callback',
} as const

export const PROTECTED_PATHS = {
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  TWO_FACTOR_AUTHENTICATION: '/profile/two-factor-authentication',
  PASSWORD_CHANGE: '/profile/password-change',
  EMAIL_CHANGE: '/profile/email-change',
  EMAIL_CHANGE_CALLBACK: '/profile/email-change-callback',
  MFA_VERIFY: '/mfa-verify',
  EXERCISES: '/exercises',
} as const

/**
 * 未ログインユーザー向けの画面パス
 * 認証済みユーザーがこれらのページにアクセスした場合、UX向上のため自動的にダッシュボードに遷移する
 */
export const UNAUTHENTICATED_USER_PATHS = [
  PUBLIC_PATHS.SIGNIN,
  PUBLIC_PATHS.SIGNIN_PASSKEY,
  PUBLIC_PATHS.SIGNUP,
  PUBLIC_PATHS.HOME,
] as const
