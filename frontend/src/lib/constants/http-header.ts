/**
 * カスタムHTTPヘッダー名の定数
 * ヘッダー名の変更に柔軟に対応するため、一箇所で管理
 */
export const CUSTOM_HEADERS = {
  /** リクエストID（トレースID） - リクエスト単位の追跡に使用 */
  REQUEST_ID: 'x-request-id',
} as const

/**
 * 型安全性のための型定義
 */
export type CustomHeaderKey = keyof typeof CUSTOM_HEADERS
export type CustomHeaderValue = (typeof CUSTOM_HEADERS)[CustomHeaderKey]
