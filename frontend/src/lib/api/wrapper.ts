import { User } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '../supabase/client/adminClient'
import { Unauthorized } from './response'
import { getAccessTokenFromHeader } from './utils'
import { Logger } from '../log/serverLog'
import { setRequestLogger } from '../log/storage'
import { LOG_MESSAGES } from '../log/message'

type BasePathParams = Record<keyof object, string | string[]>

type HandlerContext<P extends BasePathParams> = { params: Promise<P>; logger: Logger }

type BaseHandler<P extends BasePathParams> = (
  request: NextRequest,
  context: HandlerContext<P>,
) => Promise<NextResponse>

// 認証済みハンドラーの新しいシグネチャ: user情報とparamsを受け取る
type ProtectedHandler<P extends BasePathParams> = (
  request: NextRequest,
  user: User, // 認証済みユーザー情報
  context: HandlerContext<P>, // パスパラメータなどのコンテキスト
) => Promise<NextResponse>

/**
 * 全APIで共通のロガーセットアップラッパー
 * リクエストごとに専用のロガーインスタンスを作成し、コンテキストに追加
 */
export function withLogger<P extends BasePathParams = BasePathParams>(
  handler: BaseHandler<P>,
) {
  return async (request: NextRequest, context: { params: Promise<P> }) => {
    // リクエスト専用のロガーを作成
    const logger = Logger.getInstance().createRequestLogger(undefined, {
      url: request.url,
      method: request.method,
    })

    // AsyncLocalStorageにロガーを設定
    setRequestLogger(logger)

    logger.info(`Request received`)

    try {
      // ロガーをコンテキストに追加してハンドラーを実行
      const response = await handler(request, { ...context, logger })

      logger.info(`Request completed successfully`, {
        statusCode: response.status,
      })

      return response
    } catch (error) {
      logger.error('Unexpected error in handler', error, {
        errorType: 'HandlerExecutionError',
      })
      throw error
    }
  }
}

// 認証チェックとユーザーデータ抽出を行うラッパー
export function withAuth<P extends BasePathParams = BasePathParams>(
  handler: ProtectedHandler<P>,
) {
  return async (request: NextRequest, context: HandlerContext<P>) => {
    const { logger } = context

    // 認証トークンの検証
    const accessToken = getAccessTokenFromHeader(request)
    if (!accessToken) {
      logger.warn(LOG_MESSAGES.AUTH.NO_TOKEN)
      return Unauthorized({ msg: LOG_MESSAGES.AUTH.NO_TOKEN }).toResponse()
    }

    // アクセストークンからユーザー情報を取得
    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(accessToken)
    if (userError || !user) {
      logger.error(LOG_MESSAGES.AUTH.INVALID_TOKEN, userError)
      return Unauthorized({
        msg: LOG_MESSAGES.AUTH.INVALID_TOKEN,
        details: userError,
      }).toResponse()
    }

    logger.setContext({ userId: user.id })

    // 認証が成功したら、ユーザー情報を渡し、元のハンドラーを実行
    return handler(request, user, context)
  }
}
