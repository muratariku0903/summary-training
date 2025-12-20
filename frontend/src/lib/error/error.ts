/**
 * Server Component実行時のエラー
 * SSRでのデータ取得や処理中に発生するエラー
 */
export class ServerComponentExecutionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ServerComponentExecutionError'
    Object.setPrototypeOf(this, ServerComponentExecutionError.prototype)
  }
}

export class ServerActionExecutionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ServerActionExecutionError'
    Object.setPrototypeOf(this, ServerActionExecutionError.prototype)
  }
}

/**
 * セッション取得のタイムアウトエラー
 * Supabase Auth の _acquireLock がハングした場合に発生
 */
export class SessionTimeoutError extends Error {
  constructor(
    message: string = 'Session acquisition timed out',
    public readonly timeout: number,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'SessionTimeoutError'
    Object.setPrototypeOf(this, SessionTimeoutError.prototype)
  }
}
