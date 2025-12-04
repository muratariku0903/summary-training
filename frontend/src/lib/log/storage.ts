import { AsyncLocalStorage } from 'async_hooks'
import { Logger } from './serverLog'

const loggerStorage = new AsyncLocalStorage<Logger>()

/**
 * 現在のリクエストコンテキストにロガーを設定
 */
export const setRequestLogger = (logger: Logger): void => {
  loggerStorage.enterWith(logger)
}

/**
 * 現在のリクエストコンテキストからロガーを取得
 * ロガーが存在しない場合はフォールバック（グローバルインスタンス）を返す
 */
export const getRequestLogger = (): Logger => {
  return loggerStorage.getStore() ?? Logger.getInstance()
}

/**
 * ロガーが存在するかチェック
 */
export const hasRequestLogger = (): boolean => {
  return loggerStorage.getStore() !== undefined
}
