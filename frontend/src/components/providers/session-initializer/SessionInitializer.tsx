'use client'

import { useSessionInitializer } from '@/hooks/session'

/**
 * アプリケーション全体でセッションIDを初期化するコンポーネント
 * ルートレイアウトに配置して使用
 */
export function SessionInitializer() {
  useSessionInitializer()
  return null
}
