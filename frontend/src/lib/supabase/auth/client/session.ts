// import { browserClient } from '@/lib/supabase/client/browserClient'

import { clientLogger } from '@/stores/useClientLoggerStore'
import { browserClient } from '../../client/browserClient'

const SESSION_ID_KEY = 'app_session_id'

/**
 * セッションIDを取得
 * - ログイン済み: ユーザーID
 * - 未ログイン: sessionStorageから取得、なければ新規生成
 */
export async function getSessionId(): Promise<string> {
  try {
    // ログイン済みユーザーのIDを優先
    const {
      data: { session },
    } = await browserClient.auth.getSession()

    if (session?.user?.id) {
      return session.user.id
    }

    // sessionStorageが使えない場合（SSR等）は一時的なIDを生成
    return crypto.randomUUID()
  } catch (error) {
    clientLogger.error('Failed to get session ID:', error)
    return crypto.randomUUID()
  }
}

/**
 * セッションIDをクリア（ログアウト時などに使用）
 */
export function clearSessionId(): void {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    sessionStorage.removeItem(SESSION_ID_KEY)
  }
}
