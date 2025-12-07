import { redirect } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { ServerActionExecutionError } from '../error/error'
import { LOG_MESSAGES } from '../log/message'
import { Logger } from '../log/serverLog'
import { setRequestLogger } from '../log/storage'
import { ActionResult } from '../server-actions/types'
import { createServerComponentClient } from '../supabase/client/serverComponentClient'
import { PUBLIC_PATHS } from '../constants/routes'
import { headers } from 'next/headers'
import { CUSTOM_HEADERS } from '../constants/http-header'
import { getUserId } from '../supabase/auth/server/server'

type ServerActionHandler<TInput, TOutput> = (
  input: TInput,
  logger: Logger,
) => Promise<ActionResult<TOutput>>

type ProtectedServerActionHandler<TInput, TOutput> = (
  input: TInput,
  user: User,
  logger: Logger,
) => Promise<ActionResult<TOutput>>

interface WithServerActionOptions {
  actionName?: string
  requireAuth?: boolean
  [key: string]: unknown
}

/**
 * Server Actions用のログセットアップラッパー（認証不要）
 * フォーム送信やクライアント側からの変更処理に共通のロガーを提供
 *
 * @example
 * ```ts
 * export const publicAction = withServerAction(
 *   async (input: InputSchema, logger) => {
 *     logger.info('Public action started')
 *     // 処理の実装
 *     return { success: true, data }
 *   },
 *   { actionName: 'publicAction', requireAuth: false }
 * )
 * ```
 */
export function withServerAction<TInput, TOutput>(
  handler: ServerActionHandler<TInput, TOutput>,
  options?: WithServerActionOptions & { requireAuth?: false },
): (input: TInput) => Promise<ActionResult<TOutput>>

/**
 * Server Actions用のログセットアップラッパー（認証必須）
 * 認証チェックを行い、ユーザー情報をハンドラーに渡す
 *
 * @example
 * ```ts
 * export const protectedAction = withServerAction(
 *   async (input: InputSchema, user, logger) => {
 *     logger.info('Protected action started', { userId: user.id })
 *     // 処理の実装
 *     return { success: true, data }
 *   },
 *   { actionName: 'protectedAction', requireAuth: true }
 * )
 * ```
 */
export function withServerAction<TInput, TOutput>(
  handler: ProtectedServerActionHandler<TInput, TOutput>,
  options: WithServerActionOptions & { requireAuth: true },
): (input: TInput) => Promise<ActionResult<TOutput>>

export function withServerAction<TInput, TOutput>(
  handler:
    | ServerActionHandler<TInput, TOutput>
    | ProtectedServerActionHandler<TInput, TOutput>,
  options: WithServerActionOptions = {},
): (input: TInput) => Promise<ActionResult<TOutput>> {
  const { actionName, requireAuth = false, ...context } = options

  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    // リクエストヘッダーからセッションIDを取得
    const headersList = await headers()
    const requestId = headersList.get(CUSTOM_HEADERS.REQUEST_ID)

    // ユーザーIDを取得
    const userId = await getUserId()

    // リクエスト専用のロガーを作成
    const logger = Logger.getInstance().createRequestLogger(
      undefined,
      {
        type: 'server_action',
        actionName,
        requestId,
        sessionId: userId,
        userId,
        requireAuth,
        ...context,
      },
      '[SERVER_ACTION]',
      '⚡',
    )

    // AsyncLocalStorageにロガーを設定
    setRequestLogger(logger)

    logger.info(LOG_MESSAGES.SERVER_ACTION.EXECUTION_STARTED, { actionName })

    try {
      let user: User | undefined

      // 認証が必要な場合はチェックを実行
      if (requireAuth) {
        const serverComponentClient = await createServerComponentClient()

        logger.info(LOG_MESSAGES.AUTH.CHECKING)
        const {
          data: { user: authenticatedUser },
          error: authError,
        } = await serverComponentClient.auth.getUser()

        if (authError || !authenticatedUser) {
          logger.error(LOG_MESSAGES.AUTH.FAILED, authError)
          redirect(PUBLIC_PATHS.SIGNIN)
        }

        user = authenticatedUser
        logger.setContext({ userId: user.id })
        logger.info(LOG_MESSAGES.AUTH.SUCCESS, { userId: user.id })
      }

      // ハンドラーを実行
      const result = requireAuth
        ? await (handler as ProtectedServerActionHandler<TInput, TOutput>)(
            input,
            user!,
            logger,
          )
        : await (handler as ServerActionHandler<TInput, TOutput>)(input, logger)

      if (result.success) {
        logger.info(LOG_MESSAGES.SERVER_ACTION.EXECUTION_COMPLETED, {
          actionName,
          success: true,
        })
      } else {
        logger.warn(LOG_MESSAGES.SERVER_ACTION.EXECUTION_FAILED, {
          actionName,
          success: false,
          error: result.error,
        })
      }

      return result
    } catch (error) {
      const wrappedError = new ServerActionExecutionError(
        LOG_MESSAGES.SERVER_ACTION.EXECUTION_FAILED,
        error,
        { actionName, ...context },
      )
      logger.error(LOG_MESSAGES.SERVER_ACTION.EXECUTION_FAILED, wrappedError, {
        errorType: 'ServerActionExecutionError',
        actionName,
      })

      return {
        success: false,
        error: 'サーバーエラーが発生しました',
      }
    } finally {
      // クリーンアップ
      logger.clearContext()
    }
  }
}
