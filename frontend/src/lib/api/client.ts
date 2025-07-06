import { Logger } from '@/utils/log'
import type {
  paths,
  // AuthRequiredEndpoints,
  RequiresAuthForPath,
} from '@/lib/api/generated/openapi-types'
import { ERROR_CODES, ErrorCode } from './errorCodes'
import { ApiError } from './response'
import { browserClient } from '../supabase/client/browserClient'

type Path = keyof paths
type Method = 'get' | 'post' | 'patch' | 'delete'

/**
 * 成功時のレスポンス型
 */
type SuccessResponse<T> = {
  success: true
  data: T
  error?: never // successがtrueの場合、errorは存在しない
}

/**
 * エラー時のレスポンス型
 */
type ErrorResponse = {
  success: false
  data?: never // successがfalseの場合、dataは存在しない
  error: RequestError
}

/**
 * APIレスポンス型（判別可能なユニオン型）
 */
type Response<T> = SuccessResponse<T> | ErrorResponse

/**
 * 認証が必要な場合のオプション型（requireAuth必須）
 */
type AuthRequiredOptions = {
  requireAuth: true
  headers?: Record<string, string>
}

/**
 * 認証が不要な場合のオプション型（requireAuthオプショナル）
 */
type AuthOptionalOptions = {
  requireAuth?: boolean
  headers?: Record<string, string>
}

/**
 * パスとメソッドに基づいて適切なオプション型を自動選択
 */
type RequestOptionsFor<P extends Path, M extends Method> = RequiresAuthForPath<
  P,
  M
> extends true
  ? Omit<RequestInit, 'headers'> & AuthRequiredOptions // 認証必須
  : Omit<RequestInit, 'headers'> & AuthOptionalOptions // 認証オプション

/**
 * 指定パスのリクエストボディ型を抽出
 */
type RequestOf<P extends Path, M extends Method> = paths[P][M] extends {
  requestBody: { content: { 'application/json': { schema: infer B } } }
}
  ? B
  : paths[P][M] extends { parameters: { path: infer B } }
  ? B
  : unknown

/**
 * 指定パスの 200 レスポンス型を抽出
 */
type ResponseOf<P extends Path, M extends Method> = paths[P][M] extends {
  responses: {
    '200': { content: { 'application/json': { data: infer R } } }
  }
}
  ? R
  : unknown

/**
 * 汎用 HTTP Request ラッパー（認証要件自動推論）
 */
export const request = async <P extends Path, M extends Method>(
  url: P,
  method: M,
  body: RequestOf<P, M>,
  ...args: RequiresAuthForPath<P, M> extends true
    ? [options: RequestOptionsFor<P, M>] // 認証必須の場合、optionsは必須
    : [options?: RequestOptionsFor<P, M>] // 認証不要の場合、optionsはオプション
): Promise<Response<ResponseOf<P, M>>> => {
  Logger.start(request.name)

  const options = args[0] || ({} as RequestOptionsFor<P, M>)
  const { requireAuth = false, headers = {}, ...rest } = options

  try {
    console.log(`🚀 [${method}] ${url} (requireAuth: ${requireAuth})`)

    // 認証ヘッダーを取得
    const authHeaders = await getAuthHeaders(requireAuth)
    if (isRequestError(authHeaders)) {
      return {
        success: false,
        error: {
          status: authHeaders.status,
          code: authHeaders.code,
        },
      }
    }

    const res = await fetch(`/api${url}`, {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...rest,
    })

    const json = await res.json()
    console.log(`📝 [${method}] Response:`, json)

    if (!res.ok) {
      Logger.error(request.name, json)

      if (ApiError.isApiErrorObject(json)) {
        return {
          success: false,
          error: {
            status: res.status,
            code: json.error.code,
          },
        }
      }

      return {
        success: false,
        error: {
          status: 500,
          code: ERROR_CODES.INTERNAL_SERVER,
        },
      }
    }

    return {
      success: true,
      data: json.data,
    }
  } catch (e) {
    Logger.error(request.name, e)
    return {
      success: false,
      error: {
        status: 500,
        code: ERROR_CODES.INTERNAL_SERVER,
      },
    }
  } finally {
    Logger.end(request.name)
  }
}

/**
 * 認証ヘッダーを取得する内部関数
 */
const getAuthHeaders = async (
  requireAuth: boolean
): Promise<Record<string, string> | RequestError> => {
  if (!requireAuth) {
    return {}
  }

  try {
    const {
      data: { session },
      error: sessionError,
    } = await browserClient.auth.getSession()

    if (sessionError || !session) {
      console.error('❌ [AUTH] No valid session for authenticated request')
      return {
        status: 401,
        code: ERROR_CODES.UNAUTHORIZED,
      }
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
    }
  } catch (error) {
    console.error('❌ [AUTH] Failed to get session:', error)
    return {
      status: 500,
      code: ERROR_CODES.INTERNAL_SERVER,
    }
  }
}

type RequestError = {
  status: number
  code: ErrorCode
}

export const isRequestError = (obj: unknown): obj is RequestError => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'status' in obj &&
    typeof obj.status === 'number' &&
    'code' in obj &&
    typeof obj.code === 'string'
  )
}
