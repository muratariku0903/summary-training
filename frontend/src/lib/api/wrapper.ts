import { User } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '../supabase/client/adminClient'
import { Forbidden, Unauthorized } from './response'
import { getAccessTokenFromHeader } from './utils'
import { Logger } from '../log/serverLog'
import { setRequestLogger } from '../log/storage'
import { LOG_MESSAGES } from '../log/message'
import { CUSTOM_HEADERS } from '../constants/http-header'
import { checkValidSessionLevel, getUserId } from '../supabase/auth/server/server'

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
    // リクエストIDを取得
    const requestId = getRequestIdFromHeader(request)

    // ユーザーIDを取得
    const userId = await getUserId()

    // リクエスト専用のロガーを作成
    const logger = Logger.getInstance().createRequestLogger(
      requestId || undefined,
      {
        url: request.url,
        method: request.method,
        requestId,
        sessionId: userId,
      },
      '[API]',
      '🚀',
    )

    // AsyncLocalStorageにロガーを設定
    setRequestLogger(logger)

    logger.info(`Request received`)

    try {
      // ロガーをコンテキストに追加してハンドラーを実行
      const response = await handler(request, { ...context, logger })

      logger.info(`Request completed result`, {
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

    /**
     * 2段階認証（AAL2）チェック（全APIで実施）
     * - verified factor があるユーザーは currentLevel が aal2 であること
     * - checkValidSessionLevel は例外を throw する可能性があるため try/catch で扱う
     */
    try {
      const aal = await checkValidSessionLevel(user)
      if (!aal.valid) {
        logger.warn('Session assurance level is not aal2', { userId: user.id })
        return Forbidden({
          msg: 'Multi-factor authentication required',
        }).toResponse()
      }
    } catch (e) {
      logger.error('Failed to check session assurance level', e, {
        errorType: 'MfaAssuranceLevelCheckFailed',
      })
      return Unauthorized({
        msg: 'Failed to verify session assurance level',
      }).toResponse()
    }

    // 認証が成功したら、ユーザー情報を渡し、元のハンドラーを実行
    return handler(request, user, context)
  }
}

/**
 * セッションIDをヘッダーから抽出
 */
function getRequestIdFromHeader(request: NextRequest): string | null {
  return request.headers.get(CUSTOM_HEADERS.REQUEST_ID)
}
