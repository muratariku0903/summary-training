// src/lib/constants/ui.ts
/**
 * ユーザー向けの通知メッセージ定数
 */
export const UI_MESSAGES = {
  // サインアップ関連
  SIGNUP_SUCCESS_TITLE: 'メール送信完了',
  SIGNUP_SUCCESS_MESSAGE: '確認メールを送信しました。\nメールボックスをご確認ください。',
  SIGNUP_UNEXPECTED_ERROR:
    '予期しないエラーが発生しました。しばらく時間をおいて再度お試しください。',
  SIGNUP_SUBMITTING: '登録中...',
  SIGNUP_SUBMIT: '登録',
  SIGNUP_LOGIN_LINK_TEXT: 'すでにアカウントをお持ちの方は',
  SIGNUP_LOGIN_LINK_LABEL: 'こちら',

  // サインイン関連
  SIGNIN_SUCCESS_MESSAGE: 'ログインしました',
  SIGNIN_FAILED_MESSAGE: 'ログインに失敗しました',
  SIGNOUT_SUCCESS_MESSAGE: 'ログアウトしました',
  SIGNOUT_FAILED_MESSAGE: 'ログアウトに失敗しました',
  ACCOUNT_DELETE_SUCCESS_MESSAGE: 'アカウントを削除しました',
  PROFILE_UPDATE_SUCCESS_MESSAGE: 'プロフィールを更新しました',
  UNEXPECTED_ERROR:
    '予期しないエラーが発生しました。しばらく時間をおいて再度お試しください。',
  SIGNIN_SUBMITTING: 'ログイン中...',
  SIGNIN_SUBMIT: 'ログイン',
  SIGNIN_MFA_TITLE: '2段階認証',
  SIGNIN_MFA_MESSAGE: '認証アプリからの6桁のコードを入力してください',
  SIGNIN_MFA_SUBMITTING: '確認中...',
  SIGNIN_MFA_SUBMIT: 'コードを確認',
  SIGNIN_BACK_BUTTON: '← 戻る',
  SIGNIN_SIGNUP_LINK_TEXT: 'アカウントをお持ちでない方は',
  SIGNIN_SIGNUP_LINK_LABEL: 'こちら',

  // TOTP設定関連
  TOTP_SETUP_TITLE: 'TOTP設定',
  TOTP_SETUP_MESSAGE: 'QRコードを認証アプリでスキャンしてください',
  TOTP_SETUP_SUBMITTING: '設定中...',
  TOTP_SETUP_SUBMIT: '設定完了',
  TOTP_SETUP_SUCCESS: 'TOTP設を有効にしました',
  TOTP_RESET_SUCCESS: 'TOTP設定を無効にしました',
  TOTP_SETUP_SUCCESS_MESSAGE: '2段階認証の設定が完了しました',

  // 共通
  LOADING: '読み込み中...',
  PROCESSING: '処理中...',
  BACK: '戻る',
  NEXT: '次へ',
  CANCEL: 'キャンセル',
  CONFIRM: '確認',
  SAVE: '保存',
  DELETE: '削除',
  EDIT: '編集',

  // ネットワークエラー
  NETWORK_ERROR:
    'ネットワークエラーが発生しました。インターネット接続を確認してください。',
  SERVER_ERROR: 'サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。',
} as const

/**
 * フォームラベル定数
 */
export const FORM_LABELS = {
  // ユーザー情報
  USERNAME: 'ユーザーネーム',
  EMAIL: 'メールアドレス',
  PASSWORD: 'パスワード',
  CONFIRM_PASSWORD: 'パスワード（確認用）',

  // TOTP関連
  TOTP_CODE: '認証コード',
  TOTP_BACKUP_CODE: 'バックアップコード',

  // プロフィール
  DISPLAY_NAME: '表示名',
  BIO: '自己紹介',
  AVATAR: 'アバター',
} as const

/**
 * ページタイトル定数
 */
export const PAGE_TITLES = {
  SIGNUP: '新規登録',
  SIGNIN: 'ログイン',
  DASHBOARD: 'ダッシュボード',
  PROFILE: 'プロフィール',
  SETTINGS: '設定',
  TOTP_SETUP: 'TOTP設定',
} as const

/**
 * プレースホルダー定数
 */
export const PLACEHOLDERS = {
  EMAIL: 'example@email.com',
  USERNAME: 'ユーザー名を入力',
  PASSWORD: '8文字以上で入力',
  TOTP_CODE: '123456',
  SEARCH: '検索...',
} as const
