import type {
  paths,
  // AuthRequiredEndpoints,
  RequiresAuthForPath,
} from '@/lib/api/generated/openapi-types'
import { ERROR_CODES, ErrorCode } from './errorCodes'
import { ApiError } from './response'
import { browserClient } from '../supabase/client/browserClient'
import { clientLogger } from '@/stores/useClientLoggerStore'

type Path = keyof paths
type Method = 'get' | 'post' | 'patch' | 'delete'

// {xxx} を含むパスを ${string} に置換した「具体値パターン」に変換
type BracesToWild<S extends string> = S extends `${infer H}{${string}}${infer T}`
  ? BracesToWild<`${H}${string}${T}`>
  : S

// 動的な具体パス文字列 S がどの canonical パス(K)に対応するかを求める
type DynamicToCanonical<S extends string> =
  // 直接一致ならそのまま
  S extends Path
    ? S
    : // そうでなければ {param} → ${string} 置換後のパターン照合
      {
        [K in Path]: S extends BracesToWild<K> ? K : never
      }[Path]

// CanonicalPath: 動的パスを正規化（型レベル）
type CanonicalPath<S extends string> = DynamicToCanonical<S>

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
// 認証オプション型は canonical 化した後で判定
type RequestOptionsFor<P extends string, M extends Method> =
  CanonicalPath<P> extends keyof paths
    ? RequiresAuthForPath<CanonicalPath<P>, M> extends true
      ? Omit<RequestInit, 'headers'> & AuthRequiredOptions
      : Omit<RequestInit, 'headers'> & AuthOptionalOptions
    : Omit<RequestInit, 'headers'> & AuthOptionalOptions

/**
 * 指定パスのリクエストボディ型を抽出
 */
type RequestOf<P extends string, M extends Method> = P extends keyof paths
  ? paths[P][M] extends { requestBody?: { content: { 'application/json': infer B } } }
    ? B
    : paths[P][M] extends { parameters: { path: infer B } }
      ? B
      : unknown
  : unknown

/**
 * 指定パスの 200 レスポンス型を抽出
 */
type ResponseOf<P extends string, M extends Method> = P extends keyof paths
  ? paths[P][M] extends {
      responses: { '200': { content: { 'application/json': { data: infer R } } } }
    }
    ? R
    : unknown
  : unknown

/**
 * 汎用 HTTP Request ラッパー（認証要件自動推論）
 */
export const request = async <U extends string, M extends Method>(
  url: U,
  method: M,
  body: RequestOf<CanonicalPath<U>, M>,
  ...args: RequiresAuthForPath<CanonicalPath<U>, M> extends true
    ? [options: RequestOptionsFor<U, M>] // 認証必須の場合、optionsは必須
    : [options?: RequestOptionsFor<U, M>] // 認証不要の場合、optionsはオプション
): Promise<Response<ResponseOf<CanonicalPath<U>, M>>> => {
  clientLogger.start(request.name)

  const options = args[0] || ({} as RequestOptionsFor<U, M>)
  const { requireAuth = false, headers = {}, ...rest } = options

  try {
    clientLogger.info(`🚀 [${method}] ${url}  (auth: ${requireAuth})`)

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
    clientLogger.debug(`📝 [${method}] Response:`, { response: json })

    if (!res.ok) {
      clientLogger.error(request.name, new Error('Request failed'), { response: json })

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
    clientLogger.error(request.name, e)
    return {
      success: false,
      error: {
        status: 500,
        code: ERROR_CODES.INTERNAL_SERVER,
      },
    }
  } finally {
    clientLogger.end(request.name)
  }
}

/**
 * 認証ヘッダーを取得する内部関数
 */
const getAuthHeaders = async (
  requireAuth: boolean,
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
      clientLogger.error(
        '❌ [AUTH] No valid session for authenticated request',
        sessionError || new Error('No session'),
      )
      return {
        status: 401,
        code: ERROR_CODES.UNAUTHORIZED,
      }
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
    }
  } catch (error) {
    clientLogger.error('❌ [AUTH] Failed to get session', error)
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
