import { ClientLogger } from '@/lib/log/clientLog'
import { create } from 'zustand'

type ClientLoggerState = {
  logger: ClientLogger
  sessionId: string | null
  setSessionId: (sessionId: string) => void
  setContext: (context: Record<string, unknown>) => void
  clearContext: () => void
}

/**
 * グローバルなクライアントロガーストア
 * どこからでもアクセス可能なロガーインスタンスを提供
 */
export const useClientLoggerStore = create<ClientLoggerState>((set, get) => ({
  logger: new ClientLogger({ type: 'client' }),
  sessionId: null,

  setSessionId: (sessionId: string) => {
    set({ sessionId })
    get().logger.setContext({ sessionId })
  },

  setContext: (context: Record<string, unknown>) => {
    get().logger.setContext(context)
  },

  clearContext: () => {
    get().logger.clearContext()
    set({ sessionId: null })
  },
}))

/**
 * 関数内から直接呼び出せるグローバルロガー
 * Reactコンポーネント外でも使用可能
 */
export const clientLogger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    useClientLoggerStore.getState().logger.info(message, meta)
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    useClientLoggerStore.getState().logger.debug(message, meta)
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    useClientLoggerStore.getState().logger.warn(message, meta)
  },
  error: (message: string, err: unknown, meta?: Record<string, unknown>) => {
    useClientLoggerStore.getState().logger.error(message, err, meta)
  },
  start: (processName: string, meta?: Record<string, unknown>) => {
    useClientLoggerStore.getState().logger.start(processName, meta)
  },
  end: (processName: string, meta?: Record<string, unknown>) => {
    useClientLoggerStore.getState().logger.end(processName, meta)
  },
  setContext: (context: Record<string, unknown>) => {
    useClientLoggerStore.getState().setContext(context)
  },
  clearContext: () => {
    useClientLoggerStore.getState().clearContext()
  },
  setSessionId: (sessionId: string) => {
    useClientLoggerStore.getState().setSessionId(sessionId)
  },
  getSessionId: () => {
    return useClientLoggerStore.getState().sessionId
  },
}
