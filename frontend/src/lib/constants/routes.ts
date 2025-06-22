export const PUBLIC_PATHS = {
  HOME: '/',
  SIGNIN: '/signin',
  SIGNUP: '/signup',
  CALLBACK: '/callback',
} as const

export const PROTECTED_PATHS = {
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const

/**
 * 未ログインユーザー向けの画面パス
 * 認証済みユーザーがこれらのページにアクセスした場合、UX向上のため自動的にダッシュボードに遷移する
 */
export const UNAUTHENTICATED_USER_PATHS = [
  PUBLIC_PATHS.SIGNIN,
  PUBLIC_PATHS.SIGNUP,
  PUBLIC_PATHS.HOME,
] as const
