import { Logger } from '@/utils/log'
import type { paths } from '@/lib/api/generated/openapi-types'
import { ERROR_CODES, ErrorCode } from './errorCodes'
import { ApiError } from './response'

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

/** 汎用 fetch ラッパー
 *  - Body を自動 JSON.stringify
 *  - 成功時は型付き JSON を返す
 *  - 失敗時は ApiError を throw
 */
type PostResponse<T> = {
  status: number
  data: T
}

/**
 * paths 型のうち、POST メソッドが定義されているパスだけを列挙
 */
type PathWithPost = {
  [P in keyof paths]: paths[P]['post'] extends never ? never : P
}[keyof paths]

/**
 * 指定パスの POST ボディ型を抽出
 * - リクエストボディがあればそれ
 * - なければ parameters.path を使う
 */
type RequestOf<P extends PathWithPost, M extends 'get' | 'post'> =
  // リクエストボディ
  paths[P][M] extends {
    requestBody: { content: { 'application/json': { schema: infer B } } }
  }
    ? B
    : // path パラメータとして定義している場合
    paths[P][M] extends { parameters: { path: infer B } }
    ? B
    : unknown

/**
 * 指定パスの 200 レスポンス型を抽出
 */
type ResponseOf<P extends PathWithPost, M extends 'get' | 'post'> = paths[P][M] extends {
  responses: {
    '200': { content: { 'application/json': { data: infer R } } }
  }
}
  ? R
  : unknown

/**
 * 汎用 POST ラッパー
 *
 * @param url REST パス (例: '/signup')
 * @param body リクエストボディ (自動推論)
 */
export const post = async <P extends PathWithPost, M extends 'get' | 'post' = 'post'>(
  url: P,
  body: RequestOf<P, M>,
  options: RequestInit = {}
): Promise<PostResponse<ResponseOf<P, M>> | RequestError> => {
  Logger.start(post.name)

  const { headers, ...rest } = options

  try {
    console.log('start post')
    const res = await fetch(`/api${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...rest,
    })

    const json = await res.json()

    console.log('json:', json)

    if (!res.ok) {
      Logger.error(post.name, json)

      if (ApiError.isApiErrorObject(json)) {
        return {
          status: res.status,
          code: json.error.code,
        }
      }

      return {
        status: 500,
        code: ERROR_CODES.INTERNAL_SERVER,
      }
    }

    return {
      status: res.status,
      data: json.data,
    }
  } catch (e) {
    Logger.error(post.name, e)
    return {
      status: 500,
      code: ERROR_CODES.INTERNAL_SERVER,
    }
  } finally {
    Logger.end(post.name)
  }
}
