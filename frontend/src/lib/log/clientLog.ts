import * as Sentry from '@sentry/nextjs'

/**
 * クライアント側で利用するログクラス
 * Sentryとコンソールにログを出力します。
 */
export class ClientLogger {
  private context: Record<string, unknown> = {}

  constructor(initialContext: Record<string, unknown> = {}) {
    this.context = initialContext
  }

  public setContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context }
  }

  public clearContext(): void {
    this.context = {}
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
      console[level === 'debug' ? 'log' : level](
        `[${level.toUpperCase()}] ${message}`,
        logData,
      )
    }

    // Sentryに送信（infoとdebug以外）
    if (level === 'error') {
      Sentry.captureException(new Error(message), {
        level: 'error',
        extra: logData,
      })
    } else if (level === 'warn') {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: logData,
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

    // Sentryに実際のErrorオブジェクトを渡す
    if (err instanceof Error) {
      Sentry.captureException(err, {
        level: 'error',
        extra: {
          customMessage: message,
          ...this.context,
          ...meta,
        },
      })
    } else {
      Sentry.captureException(new Error(message), {
        level: 'error',
        extra: errorMeta,
      })
    }

    this.log('error', message, errorMeta)
  }

  public start(processName: string, meta: Record<string, unknown> = {}): void {
    this.info(`${processName} started`, meta)
  }

  public end(processName: string, meta: Record<string, unknown> = {}): void {
    this.info(`${processName} completed`, meta)
  }
}
