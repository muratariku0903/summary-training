import { sanitizeLogMessage, sanitizePII } from '@/utils/pii'
import * as Sentry from '@sentry/nextjs'

/**
 * クライアント側で利用するログクラス
 * Sentryとコンソールにログを出力します。
 */
export class ClientLogger {
  private static readonly PREFIX = '[CLIENT]'
  private static readonly EMOJI = '🌐'
  private static readonly RUNTIME = 'client'
  private static readonly ENVIRONMENT_TYPE = 'browser'

  private context: Record<string, unknown> = {}

  // サニタイズ設定をキャッシュ
  private sanitizeOptions = {
    maxDepth: 5,
    maxArrayLength: 100,
    maxObjectKeys: 50,
    // セキュリティ重視: 開発環境でも基本的にはサニタイズ
    // パフォーマンステスト時のみ環境変数で無効化可能
    skip: process.env.NEXT_PUBLIC_DISABLE_PII_SANITIZE === 'true',
  }

  constructor(initialContext: Record<string, unknown> = {}) {
    this.context = initialContext
    this.syncContextToSentry()
  }

  public setContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context }
    this.syncContextToSentry()
  }

  public clearContext(): void {
    this.context = {}
    Sentry.setContext('logger_context', null)
  }

  /**
   * コンテキスト情報をSentryに同期
   * 重要な情報はタグとして設定（検索・フィルタリング用）
   */
  private syncContextToSentry(): void {
    // PIIマスク処理を適用してからSentryに送信
    const sanitizedContext = sanitizePII(this.context, {
      ...this.sanitizeOptions,
      skip: false, // Sentryへの送信時は常にサニタイズ
    }) as Record<string, unknown>

    // コンテキスト全体を設定
    Sentry.setContext('logger_context', sanitizedContext)

    // 環境タグを設定（クライアント/サーバー判別用）
    Sentry.setTag('runtime', ClientLogger.RUNTIME)
    Sentry.setTag('environment_type', ClientLogger.ENVIRONMENT_TYPE)

    // 重要な情報はタグとしても設定
    if (sanitizedContext.sessionId && typeof sanitizedContext.sessionId === 'string') {
      Sentry.setTag('session_id', sanitizedContext.sessionId)
    }

    if (sanitizedContext.type && typeof sanitizedContext.type === 'string') {
      Sentry.setTag('logger_type', sanitizedContext.type)
    }
  }

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    meta: Record<string, unknown> = {},
  ): void {
    // PIIマスク処理を適用
    const sanitizedMessage = sanitizeLogMessage(message)
    const metaResult = sanitizePII(meta, this.sanitizeOptions)
    const contextResult = sanitizePII(this.context, this.sanitizeOptions)

    // 型ガードで安全にキャスト
    const sanitizedMeta = isRecord(metaResult) ? metaResult : {}
    const sanitizedContext = isRecord(contextResult) ? contextResult : {}

    const logData = {
      level,
      message: sanitizedMessage,
      timestamp: new Date().toISOString(),
      ...sanitizedContext,
      ...sanitizedMeta,
    }

    // コンソールに出力
    if (process.env.NODE_ENV === 'development') {
      const prefix = `${ClientLogger.EMOJI} ${ClientLogger.PREFIX}`
      console[level === 'debug' ? 'log' : level](
        `${prefix} [${level.toUpperCase()}] ${message}`,
        logData,
      )
    }

    // Sentryにブレッドクラムを追加（サニタイズ済みデータを使用）
    if (level !== 'error' && level !== 'warn') {
      Sentry.addBreadcrumb({
        message: `${ClientLogger.PREFIX} ${sanitizedMessage}`,
        level: level === 'debug' ? 'debug' : 'info',
        data: { ...sanitizedContext, ...sanitizedMeta },
        timestamp: Date.now() / 1000,
        category: 'client-log',
      })
    }
  }

  public info(message: string, meta: Record<string, unknown> = {}): void {
    this.log('info', message, meta)
  }

  public debug(message: string, meta: Record<string, unknown> = {}): void {
    // 本番環境ではdebugログを出力しない（パフォーマンス向上）
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.NEXT_PUBLIC_LOG_LEVEL !== 'debug'
    ) {
      return
    }
    this.log('debug', message, meta)
  }

  public warn(message: string, meta: Record<string, unknown> = {}): void {
    this.log('warn', message, meta)

    // PIIマスク処理を適用
    const sanitizedMeta = sanitizePII(meta, {
      ...this.sanitizeOptions,
      skip: false, // 警告も常にサニタイズ
    }) as Record<string, unknown>

    const sanitizedContext = sanitizePII(this.context, {
      ...this.sanitizeOptions,
      skip: false,
    }) as Record<string, unknown>

    const sanitizedMessage = sanitizeLogMessage(message)

    // Sentryに警告を送信
    Sentry.withScope((scope) => {
      scope.setLevel('warning')
      scope.setContext('warning_details', sanitizedMeta)
      scope.setTag('runtime', ClientLogger.RUNTIME)
      scope.setTag('environment_type', ClientLogger.ENVIRONMENT_TYPE)

      // コンテキスト情報をタグとして設定
      Object.entries(sanitizedContext).forEach(([key, value]) => {
        scope.setTag(key, String(value))
      })

      // 追加メタデータもタグとして設定
      Object.entries(sanitizedMeta).forEach(([key, value]) => {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          scope.setTag(`meta_${key}`, String(value))
        }
      })

      Sentry.captureMessage(`${ClientLogger.PREFIX} ${sanitizedMessage}`)
    })
  }

  public error(message: string, err: unknown, meta: Record<string, unknown> = {}): void {
    let errorMeta: Record<string, unknown> = { ...meta }
    let errorForSentry: Error

    if (isError(err)) {
      // ① Errorオブジェクトの場合
      errorMeta = {
        ...errorMeta,
        errorType: 'ErrorObject',
        errorName: err.name,
        errorMessage: err.message,
        stack: err.stack,
      }
      errorForSentry = new Error(`${ClientLogger.PREFIX} ${message}: ${err.message}`)
      errorForSentry.name = err.name
      errorForSentry.stack = err.stack
    } else if (typeof err === 'string') {
      // ② 文字列の場合
      errorMeta = {
        ...errorMeta,
        errorType: 'StringError',
        errorMessage: err,
      }
      errorForSentry = new Error(`${ClientLogger.PREFIX} ${message}: ${err}`)
    } else if (
      err &&
      typeof err === 'object' &&
      'message' in err &&
      typeof err.message === 'string'
    ) {
      // ③ オブジェクトでmessageプロパティを持つ場合
      errorMeta = {
        ...errorMeta,
        errorType: 'ObjectWithMessage',
        errorMessage: err.message,
        fullErrorObject: safeStringify(err),
      }
      errorForSentry = new Error(`${ClientLogger.PREFIX} ${message}: ${err.message}`)
    } else {
      // ④ その他の未知の型の場合
      errorMeta = {
        ...errorMeta,
        errorType: 'UnknownType',
        errorMessage: 'An unknown error occurred.',
        errorValue: safeStringify(err),
      }
      errorForSentry = new Error(`${ClientLogger.PREFIX} ${message}`)
    }

    this.log('error', message, errorMeta)

    // PIIマスク処理を適用
    const sanitizedErrorMeta = sanitizePII(errorMeta, {
      ...this.sanitizeOptions,
      skip: false,
    }) as Record<string, unknown>

    const sanitizedContext = sanitizePII(this.context, {
      ...this.sanitizeOptions,
      skip: false,
    }) as Record<string, unknown>

    // Sentryにエラーを送信
    Sentry.withScope((scope) => {
      scope.setLevel('error')
      scope.setContext('error_details', sanitizedErrorMeta)
      scope.setContext('logger_message', { message: sanitizeLogMessage(message) })
      scope.setTag('runtime', ClientLogger.RUNTIME)
      scope.setTag('environment_type', ClientLogger.ENVIRONMENT_TYPE)

      // コンテキスト情報をタグとして設定
      Object.entries(sanitizedContext).forEach(([key, value]) => {
        scope.setTag(key, String(value))
      })

      // 追加メタデータをタグとして設定
      Object.entries(sanitizedErrorMeta).forEach(([key, value]) => {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          scope.setTag(`meta_${key}`, String(value))
        }
      })

      Sentry.captureException(errorForSentry)
    })
  }

  public start(processName: string, meta: Record<string, unknown> = {}): void {
    const startMeta = { ...meta, function: processName, lifecycle: 'start' }
    this.debug(`Process started: ${processName}`, startMeta)
  }

  public end(processName: string, meta: Record<string, unknown> = {}): void {
    const endMeta = { ...meta, function: processName, lifecycle: 'end' }
    this.info(`Process finished: ${processName}`, endMeta)
  }
}

/**
 * サニタイズ結果がRecord型であることを保証
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * unknownなオブジェクトがErrorのインスタンスであるかどうかをチェックする型ガード
 */
function isError(err: unknown): err is Error {
  return err instanceof Error
}

/**
 * オブジェクトを安全にJSON文字列化する
 * 循環参照やBigIntなどの問題を回避
 */
function safeStringify(obj: unknown): string {
  const seen = new WeakSet()

  try {
    return JSON.stringify(obj, (key, value) => {
      // 循環参照チェック
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]'
        }
        seen.add(value)
      }

      // BigIntの処理
      if (typeof value === 'bigint') {
        return value.toString()
      }

      return value
    })
  } catch (error) {
    return `[Unstringifiable object: ${error}]`
  }
}
