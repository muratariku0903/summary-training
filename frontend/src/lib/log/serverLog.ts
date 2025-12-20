import { sanitizeLogMessage, sanitizePII } from '@/utils/pii'
import * as Sentry from '@sentry/nextjs'

/**
 * サーバー側で利用するログクラス
 * Vercelのログシステムに構造化ログを出力します。
 */
export class Logger {
  private static readonly DEFAULT_PREFIX = '[SERVER]'
  private static readonly DEFAULT_EMOJI = '🖥️'
  private static readonly RUNTIME = 'server'
  private static readonly ENVIRONMENT_TYPE = 'nodejs'

  private static instance: Logger
  private context: Record<string, unknown> = {}
  private prefix: string
  private emoji: string

  // サニタイズ設定をキャッシュ
  private sanitizeOptions = {
    maxDepth: 5,
    maxArrayLength: 100,
    maxObjectKeys: 50,
    // セキュリティ重視: 開発環境でも基本的にはサニタイズ
    // パフォーマンステスト時のみ環境変数で無効化可能
    skip: process.env.DISABLE_PII_SANITIZE === 'true',
  }

  private constructor(
    prefix: string = Logger.DEFAULT_PREFIX,
    emoji: string = Logger.DEFAULT_EMOJI,
  ) {
    this.prefix = prefix
    this.emoji = emoji
  }

  /**
   * ロガーのシングルトンインスタンスを取得
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * コンテキスト情報を設定（リクエストID、ユーザーIDなど）
   * @param context 追加するコンテキスト情報
   */
  public setContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context }

    // Sentryのコンテキストにも設定
    Sentry.setContext('logger_context', this.context)

    // 環境タグを設定（クライアント/サーバー判別用）
    Sentry.setTag('runtime', Logger.RUNTIME)
    Sentry.setTag('environment_type', Logger.ENVIRONMENT_TYPE)

    // 重要な情報はタグとしても設定（検索・フィルタリング用）
    if (context.requestId && typeof context.requestId === 'string') {
      Sentry.setTag('request_id', context.requestId)
    }

    if (context.sessionId && typeof context.sessionId === 'string') {
      Sentry.setTag('session_id', context.sessionId)
    }

    if (context.userId && typeof context.userId === 'string') {
      Sentry.setUser({ id: context.userId })
      Sentry.setTag('user_id', context.userId)
    }
  }

  /**
   * コンテキスト情報をクリア
   */
  public clearContext(): void {
    this.context = {}
    Sentry.setContext('logger_context', null)
  }

  /**
   * 構造化ログを出力
   * @param level ログレベル
   * @param message ログメッセージ
   * @param meta 追加メタデータ
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    meta: Record<string, unknown> = {},
  ): void {
    const timestamp = new Date().toISOString()

    // PIIマスク処理を適用
    const sanitizedMessage = sanitizeLogMessage(message)
    const metaResult = sanitizePII(meta, this.sanitizeOptions)
    const contextResult = sanitizePII(this.context, this.sanitizeOptions)

    // 型ガードで安全にキャスト
    const sanitizedMeta = isRecord(metaResult) ? metaResult : {}
    const sanitizedContext = isRecord(contextResult) ? contextResult : {}

    const logEntry = {
      timestamp,
      level,
      message: sanitizedMessage,
      ...sanitizedContext,
      ...sanitizedMeta,
    }

    // Sentryにブレッドクラムを追加（サニタイズ済みデータを使用）
    if (level !== 'error' && level !== 'warn') {
      Sentry.addBreadcrumb({
        message: `${this.prefix} ${sanitizedMessage}`,
        level: level === 'debug' ? 'debug' : 'info',
        data: { ...sanitizedContext, ...sanitizedMeta }, // ← サニタイズ済み
        timestamp: Date.now() / 1000,
        category: 'server-log',
      })
    }

    // Vercelの本番環境では構造化JSON形式で出力
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry))
    } else {
      // 開発環境では読みやすい形式で出力
      const levelEmoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level]

      const consoleMethod = level === 'debug' ? 'log' : level
      console[consoleMethod](
        `${this.emoji} ${this.prefix} ${levelEmoji} [${level.toUpperCase()}] ${timestamp} - ${message}`,
        Object.keys(meta).length > 0 ? meta : '',
      )
    }
  }

  /**
   * 情報レベルのログを出力
   * @param message ログメッセージ
   * @param meta 構造化するための追加メタデータ（オブジェクト）
   */
  public info(message: string, meta: Record<string, unknown> = {}): void {
    this.log('info', message, meta)
  }

  /**
   * デバッグレベルのログを出力
   * @param message ログメッセージ
   * @param meta 構造化するための追加メタデータ（オブジェクト）
   */
  public debug(message: string, meta: Record<string, unknown> = {}): void {
    // 本番環境ではdebugログを出力しない（パフォーマンス向上）
    if (process.env.NODE_ENV === 'production' && process.env.LOG_LEVEL !== 'debug') {
      return
    }
    this.log('debug', message, meta)
  }

  /**
   * 警告レベルのログを出力
   */
  public warn(message: string, meta: Record<string, unknown> = {}): void {
    this.log('warn', message, meta)

    // PIIマスク処理を適用（コンテキスト用）
    const sanitizedMeta = sanitizePII(meta, {
      ...this.sanitizeOptions,
      skip: false,
    }) as Record<string, unknown>

    const sanitizedMessage = sanitizeLogMessage(message)

    Sentry.withScope((scope) => {
      scope.setLevel('warning')
      scope.setContext('warning_details', sanitizedMeta)
      scope.setTag('runtime', Logger.RUNTIME)
      scope.setTag('environment_type', Logger.ENVIRONMENT_TYPE)

      // タグには識別子のみ設定（サニタイズ前の値を使用）
      // PII情報ではない識別子のみをタグとして設定
      const safeTagKeys = [
        'requestId',
        'sessionId',
        'userId',
        'type',
        'function',
        'lifecycle',
      ]

      Object.entries(this.context).forEach(([key, value]) => {
        // 安全なキーのみタグとして設定
        if (
          safeTagKeys.includes(key) &&
          (typeof value === 'string' || typeof value === 'number')
        ) {
          scope.setTag(key, String(value))
        }
      })

      Sentry.captureMessage(`${this.prefix} ${sanitizedMessage}`)
    })
  }

  /**
   * エラーレベルのログを出力
   */
  public error(message: string, err: unknown, meta: Record<string, unknown> = {}): void {
    let errorMeta: Record<string, unknown> = { ...meta }
    let errorForSentry: Error

    if (isError(err)) {
      errorMeta = {
        ...errorMeta,
        errorType: 'ErrorObject',
        errorName: err.name,
        errorMessage: err.message,
        stack: err.stack,
      }
      errorForSentry = new Error(`${this.prefix} ${message}: ${err.message}`)
      errorForSentry.name = err.name
      errorForSentry.stack = err.stack
    } else if (typeof err === 'string') {
      errorMeta = {
        ...errorMeta,
        errorType: 'StringError',
        errorMessage: err,
      }
      errorForSentry = new Error(`${this.prefix} ${message}: ${err}`)
    } else if (
      err &&
      typeof err === 'object' &&
      'message' in err &&
      typeof err.message === 'string'
    ) {
      errorMeta = {
        ...errorMeta,
        errorType: 'ObjectWithMessage',
        errorMessage: err.message,
        fullErrorObject: safeStringify(err),
      }
      errorForSentry = new Error(`${this.prefix} ${message}: ${err.message}`)
    } else {
      errorMeta = {
        ...errorMeta,
        errorType: 'UnknownType',
        errorMessage: 'An unknown error occurred.',
        errorValue: safeStringify(err),
      }
      errorForSentry = new Error(`${this.prefix} ${message}`)
    }

    this.log('error', message, errorMeta)

    // PIIマスク処理を適用（コンテキスト用）
    const sanitizedErrorMeta = sanitizePII(errorMeta, {
      ...this.sanitizeOptions,
      skip: false,
    }) as Record<string, unknown>

    Sentry.withScope((scope) => {
      scope.setLevel('error')
      scope.setContext('error_details', sanitizedErrorMeta)
      scope.setContext('logger_message', { message: sanitizeLogMessage(message) })
      scope.setTag('runtime', Logger.RUNTIME)
      scope.setTag('environment_type', Logger.ENVIRONMENT_TYPE)

      // タグには識別子のみ設定（サニタイズ前の値を使用）
      // PII情報ではない識別子のみをタグとして設定
      const safeTagKeys = [
        'requestId',
        'sessionId',
        'userId',
        'type',
        'function',
        'lifecycle',
        'errorType',
      ]

      // コンテキスト情報から安全なキーのみタグ設定
      Object.entries(this.context).forEach(([key, value]) => {
        if (
          safeTagKeys.includes(key) &&
          (typeof value === 'string' || typeof value === 'number')
        ) {
          scope.setTag(key, String(value))
        }
      })

      // エラーメタデータから安全なキーのみタグ設定
      Object.entries(errorMeta).forEach(([key, value]) => {
        if (
          safeTagKeys.includes(key) &&
          (typeof value === 'string' || typeof value === 'number')
        ) {
          scope.setTag(`meta_${key}`, String(value))
        }
      })

      Sentry.captureException(errorForSentry)
    })
  }

  /**
   * 関数や特定の処理の開始ログを出力
   * @param processName 処理名
   * @param meta 追加メタデータ
   */
  public start(processName: string, meta: Record<string, unknown> = {}): void {
    const startMeta = { ...meta, function: processName, lifecycle: 'start' }
    this.debug(`Process started: ${processName}`, startMeta)
  }

  /**
   * 関数や特定の処理の終了ログを出力
   * @param processName 処理名
   * @param meta 追加メタデータ
   */
  public end(processName: string, meta: Record<string, unknown> = {}): void {
    const endMeta = {
      ...meta,
      function: processName,
      lifecycle: 'end',
    }
    this.info(`Process finished: ${processName}`, endMeta)
  }

  /**
   * リクエストごとの新しいロガーインスタンスを作成
   * @param requestId リクエストID
   * @param initialContext 初期コンテキスト
   */
  public createRequestLogger(
    requestId?: string,
    initialContext: Record<string, unknown> = {},
    prefix?: string,
    emoji?: string,
  ): Logger {
    const requestLogger = new Logger(prefix, emoji)
    const reqId = requestId || crypto.randomUUID()
    requestLogger.setContext({
      requestId: reqId,
      ...initialContext,
    })

    return requestLogger
  }
}

/**
 * サニタイズ結果がRecord型であることを保証
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * unknownなオブジェクトがErrorのインスタンスであるかどうかをチェックする型ガード。
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

// 外部から利用しやすいようにシングルトンインスタンスをエクスポート
export const logger = Logger.getInstance()
