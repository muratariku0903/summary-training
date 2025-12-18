'use client'

import { useEffect } from 'react'
import { clientLogger } from '@/stores/useClientLoggerStore'
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
    // const {
    //   data: { subscription },
    // } = browserClient.auth.onAuthStateChange(async (event, session) => {
    //   if (event === 'SIGNED_IN') {
    //     const sessionId = await getSessionId()
    //     clientLogger.setSessionId(sessionId)
    //     clientLogger.info('User signed in, session updated', {
    //       sessionId,
    //       userId: session?.user?.id,
    //     })
    //   }
    // })

    // クリーンアップ
    return () => {
      // subscription.unsubscribe()
    }
  }, [])
}
