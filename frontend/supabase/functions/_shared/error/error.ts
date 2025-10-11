import { PostgrestError } from '@supabase/supabase-js'
import { Database, Tables } from '../types/database.ts'
import {
  DatabaseQueryOperation,
  ERROR_CATEGORIES,
  ERROR_CODES,
  ErrorCategory,
  ErrorCode,
} from './code.ts'

/**
 * ErrorCodeとErrorCategoryを保持することを保証するベースエラークラス
 */
export abstract class BaseError extends Error {
  public abstract readonly code: ErrorCode
  public abstract readonly category: ErrorCategory
  public abstract readonly functionName: string
  public abstract readonly summary?: string
  public abstract readonly detail?: string

  constructor(message: string) {
    super(message)
  }
}

export class RunJobError extends Error {
  public readonly code: ErrorCode = ERROR_CODES.DATABASE_QUERY_ERROR
  public readonly category: ErrorCategory = ERROR_CATEGORIES.SYSTEM_ERROR
  public readonly functionName: string
  constructor(
    jobKey: string,
    public readonly operation: DatabaseQueryOperation,
    error: Error,
    functionName: string,
    public readonly tableName?: keyof Database['public']['Tables'],
    code?: ErrorCode,
    category?: ErrorCategory,
  ) {
    const defaultMessage = tableName
      ? `Job記録用バッチ固有のエラーが発生しました。JobKey: ${jobKey}, ${operation}操作でエラーが発生しました (テーブル: ${tableName}), ${error.message}`
      : `Job記録用バッチ固有のエラーが発生しました。JobKey: ${jobKey}, ${operation}操作でエラーが発生しました, ${error.message}`

    super(defaultMessage)
    this.functionName = functionName
    if (code) {
      this.code = code
    }
    if (category) {
      this.category = category
    }
  }
}

export class UnusedSourcePatternNotFoundError extends BaseError {
  public readonly code: ErrorCode = ERROR_CODES.SOURCE_PATTERN_NOT_FOUND
  public readonly category: ErrorCategory = ERROR_CATEGORIES.BUSINESS_LOGIC_ERROR
  public readonly functionName: string
  public readonly summary?: string
  public readonly detail?: string
  constructor(
    functionName: string,
    public readonly profileId: string,
    public readonly sourceCombMin: number,
    public readonly sourceCombMax: number,
    public readonly allowRepeatWhenExhausted: boolean,
    summary?: string,
    detail?: string,
  ) {
    super(
      `未使用のソースパターンを取得できませんでした。プロファイルID: ${profileId}, ` +
        `ソース組み合わせ範囲: ${sourceCombMin}-${sourceCombMax}, ` +
        `重複許可: ${allowRepeatWhenExhausted ? '有効' : '無効'}`,
    )
    this.functionName = functionName
    this.summary = summary
    this.detail = detail
  }
}

export class InvalidRequestError extends BaseError {
  public readonly code: ErrorCode = ERROR_CODES.INVALID_REQUEST
  public readonly category: ErrorCategory = ERROR_CATEGORIES.VALIDATION_ERROR
  public readonly functionName: string
  public readonly summary?: string
  public readonly detail?: string
  constructor(functionName: string, message: string) {
    super(message)
    this.functionName = functionName
    this.summary = '不正なリクエストエラー'
    this.detail = message
  }
}

/**
 * データベースのテーブルにデータが存在しない場合のエラー
 */
export class EmptyTableError extends BaseError {
  public readonly code: ErrorCode = ERROR_CODES.RECORD_NOT_FOUND
  public readonly category: ErrorCategory = ERROR_CATEGORIES.BUSINESS_LOGIC_ERROR
  public readonly functionName: string
  public readonly summary?: string
  public readonly detail?: string

  constructor(
    functionName: string,
    public readonly tableName: keyof Database['public']['Tables'],
    message?: string,
    summary?: string,
    detail?: string,
  ) {
    const defaultMessage = `テーブル「${tableName}」にデータが存在しません`
    super(message || defaultMessage)
    this.functionName = functionName
    this.summary = summary || `${tableName}テーブルが空です`
    this.detail = detail || message || defaultMessage
  }
}

/**
 * データベースクエリ実行時のエラー
 */
export class DatabaseQueryError extends BaseError {
  public readonly code: ErrorCode = ERROR_CODES.DATABASE_QUERY_ERROR
  public readonly category: ErrorCategory = ERROR_CATEGORIES.SYSTEM_ERROR
  public readonly functionName: string
  public readonly summary?: string
  public readonly detail?: string

  constructor(
    functionName: string,
    public readonly operation: DatabaseQueryOperation,
    public readonly tableName?: keyof Database['public']['Tables'],
    message?: string,
    summary?: string,
    detail?: string,
  ) {
    const defaultMessage = tableName
      ? `${operation}操作でエラーが発生しました (テーブル: ${tableName})`
      : `${operation}操作でエラーが発生しました`

    super(message || defaultMessage)
    this.functionName = functionName
    this.summary = summary || 'データベースクエリエラー'
    this.detail = detail || message || defaultMessage
  }
}
/**
 * データベース関数実行時のエラー
 */

export class DatabaseFunctionsError extends BaseError {
  public readonly code: ErrorCode = ERROR_CODES.DATABASE_DIRECTLY_QUERY_ERROR
  public readonly category: ErrorCategory = ERROR_CATEGORIES.SYSTEM_ERROR
  public readonly functionName: string
  public readonly summary?: string
  public readonly detail?: string

  constructor(
    functionName: string,
    public readonly dbFunction: keyof Database['public']['Functions'],
    detail?: string,
  ) {
    const defaultMessage = `${dbFunction}関数でエラーが発生しました `

    super(defaultMessage)
    this.functionName = functionName
    this.summary = defaultMessage
    this.detail = detail
  }
}

/**
 * クエリ直接実行時のエラー
 */
export class DirectlyExecutingQueryError extends BaseError {
  public readonly code: ErrorCode = ERROR_CODES.DATABASE_FUNCTION_ERROR
  public readonly category: ErrorCategory = ERROR_CATEGORIES.SYSTEM_ERROR
  public readonly functionName: string
  public readonly summary?: string
  public readonly detail?: string

  constructor(functionName: string, error: unknown, query: string) {
    let message = 'クエリ実行エラー'

    if (error instanceof PostgrestError) {
      message += ` エラー名: ${PostgrestError.name}, code: ${error.code}, cause: ${error.cause}, message: ${error.message}`
    } else {
      message += ` 予期せぬエラー: ${error}`
    }

    super(message)
    this.functionName = functionName
    this.summary = message
    this.detail = `query: ${query}`
  }
}

/**
 * 生成AIのエラー
 */
export class LlmError extends BaseError {
  public readonly code: ErrorCode
  public readonly category: ErrorCategory = ERROR_CATEGORIES.SYSTEM_ERROR
  public readonly functionName: string
  public readonly summary?: string
  public readonly detail?: string

  constructor(
    code: ErrorCode,
    functionName: string,
    llm: Tables<'llms'>['vendor'],
    model: string,
    prompt: string,
    detail?: string,
  ) {
    const defaultMessage = `LLM:${llm},Model:${model}の処理でエラーが発生しました`

    super(defaultMessage)
    this.code = code
    this.functionName = functionName
    this.summary = `LLM:${llm},Model:${model}の処理でエラーが発生しました`
    this.detail = `${detail ? detail : ''} prompt: ${prompt}`
  }
}

// 業務関連のエラー
export class OperationError extends BaseError {
  public readonly code: ErrorCode
  public readonly category: ErrorCategory = ERROR_CATEGORIES.BUSINESS_LOGIC_ERROR
  public readonly functionName: string
  public readonly summary?: string
  public readonly detail?: string
  constructor(functionName: string, code: ErrorCode, summary: string, detail: string) {
    super(`${summary} ${detail}`)
    this.functionName = functionName
    this.code = code
    this.summary = summary
    this.detail = detail
  }
}

export class UnexpectedError extends BaseError {
  public readonly code: ErrorCode = ERROR_CODES.UNEXPECTED_ERROR
  public readonly category: ErrorCategory = ERROR_CATEGORIES.SYSTEM_ERROR
  public readonly functionName: string
  public readonly summary?: string
  public readonly detail?: string
  constructor(
    functionName: string,
    error: unknown,
    context?: string,
    summary?: string,
    detail?: string,
  ) {
    const message = UnexpectedError.extractErrorMessage(error, context)
    super(message)
    this.functionName = functionName
    this.summary = summary
    this.detail = detail
  }

  /**
   * unknown 型のエラーから安全にメッセージを抽出
   */
  private static extractErrorMessage(error: unknown, context?: string): string {
    let errorMessage = '不明なエラーが発生しました'

    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object') {
      // オブジェクトの場合、JSON.stringify で文字列化を試みる
      try {
        errorMessage = JSON.stringify(error)
      } catch {
        errorMessage = '[オブジェクト形式のエラー]'
      }
    } else if (error === null) {
      errorMessage = 'null値のエラー'
    } else if (error === undefined) {
      errorMessage = 'undefined値のエラー'
    } else {
      errorMessage = String(error)
    }

    // コンテキスト情報があれば追加
    if (context) {
      return `${context}: ${errorMessage}`
    }

    return errorMessage
  }
}
