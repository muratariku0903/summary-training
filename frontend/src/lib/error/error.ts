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
