'use client'

import { useEffect } from 'react'
import { clientLogger } from '@/stores/useClientLoggerStore'
import { browserClient } from '@/lib/supabase/client/browserClient'
import { getSessionId } from '@/lib/supabase/auth/client/session'

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
    const {
      data: { subscription },
    } = browserClient.auth.onAuthStateChange(async (event, session) => {
      const sessionId = await getSessionId()
      clientLogger.setSessionId(sessionId) 

      if (event === 'SIGNED_IN') {
        clientLogger.info('User signed in, session updated', {
          sessionId,
          userId: session?.user?.id,
        })
      } else if (event === 'SIGNED_OUT') {
        clientLogger.info('User signed out, session reset', { sessionId })
      } else if (event === 'TOKEN_REFRESHED') {
        clientLogger.debug('Token refreshed, session maintained', { sessionId })
      }
    })

    // クリーンアップ
    return () => {
      subscription.unsubscribe()
    }
  }, [])
}
