// src/lib/errors.ts
import { NextResponse } from 'next/server'
import { ERROR_CODES, ERROR_MESSAGES, ErrorCode } from './errorCodes'
import { z } from 'zod'
import { notifySentry } from '../sentry/utils'

/** 共通API正常系オブジェクトの型 */
export const apiSuccessObjectSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string().optional(),
    meta: z.record(z.unknown()).optional(),
  })
export type ApiSuccessObject<S extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof apiSuccessObjectSchema<S>>
>
export class ApiSuccess<T extends z.ZodTypeAny> {
  status: number
  body: ApiSuccessObject<T>

  constructor(
    status: number,
    data: T,
    message?: string,
    meta?: ApiSuccessObject<T>['meta'],
  ) {
    this.status = status
    this.body = { data, message, meta }
  }

  /** NextResponse に変換 */
  toResponse() {
    return NextResponse.json(this.body, { status: this.status })
  }
}

/** 共通エラーオブジェクトの型 */
export const apiErrorObjectSchema = z.object({
  code: z.nativeEnum(ERROR_CODES),
  message: z.string(),
  details: z.unknown().optional(),
})
export type ApiErrorObject = z.infer<typeof apiErrorObjectSchema>

export class ApiError extends Error {
  status: number
  body: ApiErrorObject

  constructor(status: number, code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.body = { code, message, details }

    // ログに出力
    console.error(message, details)

    // Sentryへ通知
    notifySentry(this, {
      status,
      errorCode: code,
      errorMessage: message,
      errorDetails: details,
    })
  }

  /** NextResponse に変換 */
  toResponse() {
    return NextResponse.json({ error: this.body }, { status: this.status })
  }

  static isApiErrorObject = (obj: unknown): obj is { error: ApiErrorObject } => {
    return (
      obj !== null &&
      typeof obj === 'object' &&
      'error' in obj &&
      typeof obj.error === 'object' &&
      obj.error !== null &&
      'code' in obj.error &&
      'message' in obj.error &&
      typeof obj.error.code === 'string' &&
      typeof obj.error.message === 'string'
    )
  }
}

/* ---------- ショートカット関数 ---------- */
export const Success = <T extends z.ZodTypeAny>(
  data: z.infer<T>,
  message?: string,
  meta?: ApiSuccessObject<T>['meta'],
) => new ApiSuccess(200, data, message, meta)

export const Created = <T extends z.ZodTypeAny>(
  data: z.infer<T>,
  message?: string,
  meta?: ApiSuccessObject<T>['meta'],
) => new ApiSuccess(201, data, message, meta)

type ApiErrorParams = {
  msg?: string
  details?: unknown
}
export const BadRequest = (params?: ApiErrorParams) =>
  new ApiError(
    400,
    ERROR_CODES.BAD_REQUEST,
    params?.msg ?? ERROR_MESSAGES.BAD_REQUEST,
    params?.details,
  )

export const Unauthorized = (params?: ApiErrorParams) =>
  new ApiError(
    401,
    ERROR_CODES.UNAUTHORIZED,
    params?.msg ?? ERROR_MESSAGES.UNAUTHORIZED,
    params?.details,
  )

export const Forbidden = (params?: ApiErrorParams) =>
  new ApiError(
    403,
    ERROR_CODES.FORBIDDEN,
    params?.msg ?? ERROR_MESSAGES.FORBIDDEN,
    params?.details,
  )

export const NotFound = (params?: ApiErrorParams) =>
  new ApiError(
    404,
    ERROR_CODES.NOT_FOUND,
    params?.msg ?? ERROR_MESSAGES.NOT_FOUND,
    params?.details,
  )

export const Conflict = (params?: ApiErrorParams) =>
  new ApiError(
    409,
    ERROR_CODES.CONFLICT,
    params?.msg ?? ERROR_MESSAGES.CONFLICT,
    params?.details,
  )

export const InternalError = (params?: ApiErrorParams) =>
  new ApiError(
    500,
    ERROR_CODES.INTERNAL_SERVER,
    params?.msg ?? ERROR_MESSAGES.INTERNAL_SERVER,
    params?.details,
  )
