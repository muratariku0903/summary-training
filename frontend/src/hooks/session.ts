'use client'

import { useEffect } from 'react'
import { clientLogger } from '@/stores/useClientLoggerStore'
import { getSessionId } from '@/lib/supabase/auth/client/session'
import { browserClient } from '@/lib/supabase/client/browserClient'

/**
 * アプリケーション起動時にセッションIDをロガーに設定
 * 認証状態の変化も監視して自動更新
 */
export function useSessionInitializer() {
  useEffect(() => {
    // 初期セッションIDを設定
    const initializeSession = async () => {
      const sessionId = await getSessionId()
      clientLogger.setSessionId(sessionId)
      clientLogger.info('Client session initialized', { sessionId })
    }

    initializeSession()

    // 認証状態の変化を監視してセッションIDを更新
    const { data } = browserClient.auth.onAuthStateChange(async (event, session) => {
      // 必要なイベントだけ処理（ノイズ/負荷低減）
      if (event !== 'SIGNED_IN' && event !== 'TOKEN_REFRESHED' && event !== 'SIGNED_OUT')
        return

      const sessionId = session?.user?.id ?? null
      if (sessionId) {
        clientLogger.setSessionId(sessionId)
      }
      clientLogger.info('Auth state changed, session updated', {
        event,
        sessionId,
        userId: sessionId,
      })
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])
}
