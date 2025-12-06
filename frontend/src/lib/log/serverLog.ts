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
    if (context.sessionId && typeof context.sessionId === 'string') {
      Sentry.setTag('session_id', context.sessionId)
    }

    if (context.userId && typeof context.userId === 'string') {
      Sentry.setUser({ id: context.userId })
      Sentry.setTag('user_id', context.userId)
    }

    if (context.requestId && typeof context.requestId === 'string') {
      Sentry.setTag('request_id', context.requestId)
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
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...meta,
    }

    // Sentryにブレッドクラムを追加（エラートレースに役立つ）
    if (level !== 'error' && level !== 'warn') {
      Sentry.addBreadcrumb({
        message: `${this.prefix} ${message}`,
        level: level === 'debug' ? 'debug' : 'info',
        data: { ...this.context, ...meta },
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
   * @param message ログメッセージ
   * @param meta 構造化するための追加メタデータ（オブジェクト）
   */
  public warn(message: string, meta: Record<string, unknown> = {}): void {
    this.log('warn', message, meta)

    // Sentryに警告レベルで報告
    Sentry.withScope((scope) => {
      scope.setLevel('warning')
      scope.setContext('warning_details', meta)
      scope.setTag('runtime', Logger.RUNTIME)
      scope.setTag('environment_type', Logger.ENVIRONMENT_TYPE)
      Object.entries(this.context).forEach(([key, value]) => {
        scope.setTag(key, String(value))
      })
      Sentry.captureMessage(`${this.prefix} ${message}`)
    })
  }

  /**
   * エラーレベルのログを出力
   * Errorオブジェクトとメッセージを組み合わせて出力し、スタックトレースを含める
   * @param message ログメッセージ
   * @param err unknown型でキャッチされたエラー（Error, string, その他の可能性）
   * @param meta 構造化するための追加メタデータ（オブジェクト）
   */
  public error(message: string, err: unknown, meta: Record<string, unknown> = {}): void {
    let errorMeta: Record<string, unknown> = { ...meta }
    let errorForSentry: Error

    if (isError(err)) {
      // ① Errorオブジェクトの場合：name, message, stackを安全に抽出
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
      // ② 文字列の場合：メッセージとして記録
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
      // ③ オブジェクトでmessageプロパティを持つ場合（例: { message: '...' }）
      errorMeta = {
        ...errorMeta,
        errorType: 'ObjectWithMessage',
        errorMessage: err.message,
        fullErrorObject: safeStringify(err),
      }
      errorForSentry = new Error(`${this.prefix} ${message}: ${err.message}`)
    } else {
      // ④ その他の未知の型の場合：型情報を記録
      errorMeta = {
        ...errorMeta,
        errorType: 'UnknownType',
        errorMessage: 'An unknown error occurred.',
        errorValue: safeStringify(err),
      }
      errorForSentry = new Error(`${this.prefix} ${message}`)
    }

    this.log('error', message, errorMeta)

    // Sentryにエラーを報告
    Sentry.withScope((scope) => {
      scope.setLevel('error')
      scope.setContext('error_details', errorMeta)
      scope.setContext('logger_message', { message })
      scope.setTag('runtime', Logger.RUNTIME)
      scope.setTag('environment_type', Logger.ENVIRONMENT_TYPE)

      // コンテキスト情報をタグとして設定（検索・フィルタリング用）
      Object.entries(this.context).forEach(([key, value]) => {
        scope.setTag(key, String(value))
      })

      // 追加メタデータをタグとして設定
      Object.entries(meta).forEach(([key, value]) => {
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
  try {
    return JSON.stringify(obj, (key, value) => {
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
