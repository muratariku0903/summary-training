import { ERROR_CATEGORIES, ERROR_CODES, ErrorCategory, ErrorCode } from './code.ts'

export class UnusedSourcePatternNotFoundError extends Error {
  public readonly code: ErrorCode = ERROR_CODES.SOURCE_PATTERN_NOT_FOUND
  public readonly category: ErrorCategory = ERROR_CATEGORIES.BUSINESS_LOGIC_ERROR
  constructor(
    public readonly profileId: string,
    public readonly sourceCombMin: number,
    public readonly sourceCombMax: number,
    public readonly allowRepeatWhenExhausted: boolean,
  ) {
    super(
      `未使用のソースパターンを取得できませんでした。プロファイルID: ${profileId}, ` +
        `ソース組み合わせ範囲: ${sourceCombMin}-${sourceCombMax}, ` +
        `重複許可: ${allowRepeatWhenExhausted ? '有効' : '無効'}`,
    )
  }
}
