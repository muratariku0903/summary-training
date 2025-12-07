import { headers } from 'next/headers'
import { ServerComponentExecutionError } from '../error/error'
import { LOG_MESSAGES } from './message'
import { Logger } from './serverLog'
import { setRequestLogger } from './storage'
import { getUserId } from '../supabase/auth/server/server'
import { CUSTOM_HEADERS } from '../constants/http-header'

type ServerComponentHandler<T> = (logger: Logger) => Promise<T>

/**
 * Server Components用のログセットアップラッパー
 * SSRでのデータ取得処理に共通のロガーを提供
 *
 * @example
 * ```tsx
 * const data = await withServerLogger(async (logger) => {
 *   logger.info('Fetching data...')
 *   const result = await fetchData()
 *   return result
 * })
 * ```
 */
export async function withServerLogger<T>(
  handler: ServerComponentHandler<T>,
  context?: Record<string, unknown>,
): Promise<T> {
  // リクエストヘッダーからセッションIDを取得
  const headersList = await headers()
  const requestId = headersList.get(CUSTOM_HEADERS.REQUEST_ID)

  // ユーザーIDを取得
  const userId = await getUserId()

  // リクエスト専用のロガーを作成
  const logger = Logger.getInstance().createRequestLogger(
    requestId || undefined,
    {
      type: 'server_component',
      requestId,
      sessionId: userId,
      userId,
      ...context,
    },
    '[SERVER_COMPONENT]',
    '⚛️',
  )

  setRequestLogger(logger)

  logger.info(LOG_MESSAGES.SERVER_COMPONENT.EXECUTION_STARTED)

  try {
    const result = await handler(logger)

    logger.info(LOG_MESSAGES.SERVER_COMPONENT.EXECUTION_COMPLETED)

    return result
  } catch (error) {
    const wrappedError = new ServerComponentExecutionError(
      LOG_MESSAGES.SERVER_COMPONENT.EXECUTION_FAILED,
      error,
      context,
    )
    logger.error(LOG_MESSAGES.SERVER_COMPONENT.EXECUTION_FAILED, wrappedError, {
      errorType: 'ServerComponentExecutionError',
    })
    throw wrappedError
  } finally {
    // クリーンアップ
    logger.clearContext()
  }
}
