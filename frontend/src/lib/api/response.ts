// src/lib/errors.ts
import { NextResponse } from 'next/server'
import { ERROR_CODES, ErrorCode } from './errorCodes'
import { z } from 'zod'

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
    meta?: ApiSuccessObject<T>['meta']
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
  meta?: ApiSuccessObject<T>['meta']
) => new ApiSuccess(200, data, message, meta)

export const Created = <T extends z.ZodTypeAny>(
  data: z.infer<T>,
  message?: string,
  meta?: ApiSuccessObject<T>['meta']
) => new ApiSuccess(201, data, message, meta)

export const BadRequest = (msg = 'Bad request', details?: unknown) =>
  new ApiError(400, ERROR_CODES.BAD_REQUEST, msg, details)

export const Unauthorized = (msg = 'Unauthorized', details?: unknown) =>
  new ApiError(401, ERROR_CODES.UNAUTHORIZED, msg, details)

export const NotFound = (msg = 'Not found', details?: unknown) =>
  new ApiError(404, ERROR_CODES.NOT_FOUND, msg, details)

export const InternalError = (msg = 'Internal server error', details?: unknown) =>
  new ApiError(500, ERROR_CODES.INTERNAL_SERVER, msg, details)
