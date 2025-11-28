export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER: 'INTERNAL_SERVER',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  BAD_REQUEST: 'Bad request',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not found',
  CONFLICT: 'Conflict',
  INTERNAL_SERVER: 'Internal server error',
}

export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES]

// 詳細なエラーメッセージの定義を追加
export const DETAILED_ERROR_MESSAGES = {
  // 認証関連
  AUTH: {
    NO_TOKEN: 'Authorization header required',
    INVALID_TOKEN: 'Invalid access token',
    TOKEN_EXPIRED: 'Access token has expired',
  },
  // バリデーション関連
  VALIDATION: {
    INVALID_REQUEST: 'Invalid request body',
    MISSING_REQUIRED_FIELD: 'Required field is missing',
  },
  // リソース取得関連
  RESOURCE: {
    EXERCISE_FETCH_FAILED: 'Failed to fetch exercise data',
    EXERCISE_CONTENT_FETCH_FAILED: 'Failed to fetch exercise content',
    RUBRICS_FETCH_FAILED: 'Failed to fetch rubrics',
  },
  // 処理関連
  PROCESSING: {
    LLM_EVALUATION_FAILED: 'LLM evaluation failed',
    SAVE_RESULT_FAILED: 'Failed to save evaluation result',
    UNEXPECTED_ERROR: 'Unexpected error occurred',
  },
} as const
