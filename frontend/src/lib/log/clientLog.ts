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
    // コンテキスト全体を設定
    Sentry.setContext('logger_context', this.context)

    // 環境タグを設定（クライアント/サーバー判別用）
    Sentry.setTag('runtime', ClientLogger.RUNTIME)
    Sentry.setTag('environment_type', ClientLogger.ENVIRONMENT_TYPE)

    // 重要な情報はタグとしても設定
    if (this.context.sessionId && typeof this.context.sessionId === 'string') {
      Sentry.setTag('session_id', this.context.sessionId)
    }

    if (this.context.type && typeof this.context.type === 'string') {
      Sentry.setTag('logger_type', this.context.type)
    }
  }

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    meta: Record<string, unknown> = {},
  ): void {
    const logData = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...meta,
    }

    // コンソールに出力
    if (process.env.NODE_ENV === 'development') {
      const prefix = `${ClientLogger.EMOJI} ${ClientLogger.PREFIX}`
      console[level === 'debug' ? 'log' : level](
        `${prefix} [${level.toUpperCase()}] ${message}`,
        logData,
      )
    }

    // Sentryにブレッドクラムを追加（エラートレースに役立つ）
    // warn/errorは各メソッドで個別に送信するのでブレッドクラムのみ
    if (level !== 'error' && level !== 'warn') {
      Sentry.addBreadcrumb({
        message: `${ClientLogger.PREFIX} ${message}`,
        level: level === 'debug' ? 'debug' : 'info',
        data: { ...this.context, ...meta },
        timestamp: Date.now() / 1000,
        category: 'client-log',
      })
    }
  }

  public info(message: string, meta: Record<string, unknown> = {}): void {
    this.log('info', message, meta)
  }

  public debug(message: string, meta: Record<string, unknown> = {}): void {
    this.log('debug', message, meta)
  }

  public warn(message: string, meta: Record<string, unknown> = {}): void {
    this.log('warn', message, meta)

    // Sentryに警告を送信
    Sentry.withScope((scope) => {
      scope.setLevel('warning')
      scope.setContext('warning_details', meta)
      scope.setTag('runtime', ClientLogger.RUNTIME)
      scope.setTag('environment_type', ClientLogger.ENVIRONMENT_TYPE)

      // コンテキスト情報をタグとして設定（検索・フィルタリング用）
      Object.entries(this.context).forEach(([key, value]) => {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          scope.setTag(key, String(value))
        }
      })

      // 追加メタデータもタグとして設定
      Object.entries(meta).forEach(([key, value]) => {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          scope.setTag(`meta_${key}`, String(value))
        }
      })

      Sentry.captureMessage(`${ClientLogger.PREFIX} ${message}`)
    })
  }

  public error(message: string, err: unknown, meta: Record<string, unknown> = {}): void {
    const errorMeta = {
      ...meta,
      error:
        err instanceof Error
          ? {
              name: err.name,
              message: err.message,
              stack: err.stack,
            }
          : String(err),
    }

    this.log('error', message, errorMeta)

    // Sentryにエラーを送信
    Sentry.withScope((scope) => {
      scope.setLevel('error')
      scope.setContext('error_details', errorMeta)
      scope.setContext('logger_message', { message })
      scope.setTag('runtime', ClientLogger.RUNTIME)
      scope.setTag('environment_type', ClientLogger.ENVIRONMENT_TYPE)

      // コンテキスト情報をタグとして設定（検索・フィルタリング用）
      Object.entries(this.context).forEach(([key, value]) => {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          scope.setTag(key, String(value))
        }
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

      // 実際のErrorオブジェクトを渡す
      if (err instanceof Error) {
        // 元のエラーを複製してメッセージを変更
        const clientError = new Error(`${ClientLogger.PREFIX} ${message}: ${err.message}`)
        clientError.name = err.name
        clientError.stack = err.stack
        Sentry.captureException(clientError)
      } else {
        Sentry.captureException(new Error(`${ClientLogger.PREFIX} ${message}`))
      }
    })
  }

  public start(processName: string, meta: Record<string, unknown> = {}): void {
    this.info(`${processName} started`, meta)
  }

  public end(processName: string, meta: Record<string, unknown> = {}): void {
    this.info(`${processName} completed`, meta)
  }
}
