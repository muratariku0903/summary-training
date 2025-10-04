import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
} from 'npm:winston@3.11.0'

const logLevel = Deno.env.get('LOG_LEVEL') || 'debug'

/**
 * Edge Functions向けのロギングユーティリティクラス（シングルトン）
 * Denoのconsole.log経由でSupabaseのログエクスプローラに構造化ログを出力します。
 */
export class Logger {
  private static instance: Logger
  private winstonLogger: WinstonLogger

  private constructor() {
    this.winstonLogger = createLogger({
      level: logLevel,
      // ログフォーマット: JSON形式で構造化し、タイムスタンプとレベルを追加
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        // format.json(),
        format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr =
            Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : ''
          return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`
        }),
      ),
      transports: [new transports.Console()],
    })
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
   * 情報レベルのログを出力
   * @param message ログメッセージ
   * @param meta 構造化するための追加メタデータ（オブジェクト）
   */
  public info(message: string, meta: Record<string, unknown> = {}): void {
    this.winstonLogger.info(message, meta)
  }

  /**
   * デバッグレベルのログを出力
   * @param message ログメッセージ
   * @param meta 構造化するための追加メタデータ（オブジェクト）
   */
  public debug(message: string, meta: Record<string, unknown> = {}): void {
    this.winstonLogger.debug(message, meta)
  }

  /**
   * エラーレベルのログを出力
   * Errorオブジェクトとメッセージを組み合わせて出力し、スタックトレースを含めます
   * @param message ログメッセージ
   * @param error err unknown型でキャッチされたエラー（Error, string, その他の可能性）
   * @param meta 構造化するための追加メタデータ（オブジェクト）
   */
  public error(message: string, err: unknown, meta: Record<string, unknown> = {}): void {
    let errorMeta: Record<string, unknown> = { ...meta }
    if (isError(err)) {
      // ① Errorオブジェクトの場合：name, message, stackを安全に抽出
      errorMeta = {
        ...errorMeta,
        errorType: 'ErrorObject',
        errorName: err.name,
        errorMessage: err.message,
        stack: err.stack,
      }
    } else if (typeof err === 'string') {
      // ② 文字列の場合：メッセージとして記録
      errorMeta = {
        ...errorMeta,
        errorType: 'StringError',
        errorMessage: err,
      }
    } else if (
      err &&
      typeof err === 'object' &&
      'message' in err &&
      typeof err.message === 'string'
    ) {
      // ③ オブジェクトでmessageプロパティを持つ場合（例: { message: '...' }）
      // 厳密にはErrorではないが、メッセージとして有用な情報を抽出
      errorMeta = {
        ...errorMeta,
        errorType: 'ObjectWithMessage',
        errorMessage: err.message,
        fullErrorObject: JSON.stringify(err), // オブジェクト全体をJSON文字列として保存
      }
    } else {
      // ④ その他の未知の型の場合：型情報を記録
      errorMeta = {
        ...errorMeta,
        errorType: 'UnknownType',
        errorMessage: 'An unknown error occurred.',
        errorValue: JSON.stringify(err),
      }
    }

    this.winstonLogger.error(message, errorMeta)
  }

  /**
   * 関数や特定の処理の開始ログを出力
   * @param functionName 処理名
   * @param meta 追加メタデータ
   */
  public start(functionName: string, meta: Record<string, unknown> = {}): void {
    const startMeta = { ...meta, function: functionName, lifecycle: 'start' }
    this.debug(`Function started: ${functionName}`, startMeta)
  }

  /**
   * 関数や特定の処理の終了ログを出力（処理時間を含む）
   * @param functionName 処理名
   * @param startTime 処理開始時のUNIXタイムスタンプ（ミリ秒）
   * @param meta 追加メタデータ
   */
  public end(functionName: string, meta: Record<string, unknown> = {}): void {
    const endMeta = {
      ...meta,
      function: functionName,
      lifecycle: 'end',
    }
    this.info(`Function finished: ${functionName}`, endMeta)
  }
}

/**
 * unknownなオブジェクトがErrorのインスタンスであるかどうかをチェックする型ガード。
 */
function isError(err: unknown): err is Error {
  return err instanceof Error
}

// 外部から利用しやすいようにシングルトンインスタンスをエクスポート
export const logger = Logger.getInstance()
