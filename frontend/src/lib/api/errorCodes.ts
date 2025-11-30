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
export const LOG_MESSAGES = {
  // 認証関連
  AUTH: {
    NO_TOKEN: 'Authorization header required',
    INVALID_TOKEN: 'Invalid access token',
    TOKEN_EXPIRED: 'Access token has expired',
    INVALID_SESSION_LEVEL: 'Invalid session level',
    TOKEN_VERIFY_STARTED: 'Token verification started',
    TOKEN_VERIFY_FAILED: 'Token verification failed',
    TOKEN_VERIFY_COMPLETED: 'Token verified successfully',
    EMAIL_UNVERIFIED: 'Email is not verified',
    CODE_EXCHANGE_STARTED: 'Code exchange for session started',
    CODE_EXCHANGE_FAILED: 'Failed to exchange code for session',
    CODE_EXCHANGE_COMPLETED: 'Code exchange completed successfully',
    OTP_VERIFY_STARTED: 'OTP verification started',
    OTP_VERIFY_FAILED: 'Failed to verify OTP',
    OTP_VERIFY_COMPLETED: 'OTP verified successfully',
    MFA_REQUIRED: 'MFA verification required',
  },
  // バリデーション関連
  VALIDATION: {
    INVALID_REQUEST: 'Invalid request body',
    REQUEST_VALIDATED: 'Request validated successfully',
    MISSING_REQUIRED_FIELD: 'Required field is missing',
  },
  // リソース取得関連
  RESOURCE: {
    EXERCISE_FETCH_FAILED: 'Failed to fetch exercise data',
    EXERCISE_FETCHED: 'Exercise data fetched successfully',
    EXERCISE_CONTENT_FETCH_FAILED: 'Failed to fetch exercise content',
    EXERCISE_CONTENT_FETCHED: 'Exercise content fetched successfully',
    RUBRICS_FETCH_FAILED: 'Failed to fetch rubrics',
    RUBRICS_FETCHED: 'Rubrics fetched successfully',
    USER_PROFILE_FETCH_STARTED: 'User profile fetch started',
    USER_PROFILE_FETCH_FAILED: 'Failed to fetch user profile',
    USER_PROFILE_FETCH_COMPLETED: 'User profile fetched successfully',
    USER_FETCH_FAILED: 'Failed to fetch user data',
    DESCOPE_USER_ID_FETCH_FAILED: 'Failed to fetch Descope user ID',
    SHADOW_USER_ENSURE_STARTED: 'Shadow user ensure process started',
    SHADOW_USER_ENSURE_FAILED: 'Failed to ensure shadow user',
    SHADOW_USER_ENSURE_COMPLETED: 'Shadow user ensured successfully',
    METADATA_UPDATE_STARTED: 'User metadata update started',
    METADATA_UPDATE_FAILED: 'Failed to update user metadata',
    METADATA_UPDATE_COMPLETED: 'User metadata updated successfully',
  },
  // 処理関連
  PROCESSING: {
    STARTED: 'Processing started',
    COMPLETED: 'Processing completed successfully',
    LLM_EVALUATION_STARTED: 'LLM evaluation started',
    LLM_EVALUATION_COMPLETED: 'LLM evaluation completed successfully',
    LLM_EVALUATION_FAILED: 'LLM evaluation failed',
    SAVE_RESULT_STARTED: 'Saving evaluation result',
    SAVE_RESULT_COMPLETED: 'Evaluation result saved successfully',
    SAVE_RESULT_FAILED: 'Failed to save evaluation result',
    UNEXPECTED_ERROR: 'Unexpected error occurred',
    USER_DELETE_STARTED: 'User deletion process started',
    USER_DELETE_COMPLETED: 'User account has been successfully deleted',
    USER_DELETE_FAILED: 'User deletion failed',
    DESCOPE_USER_DELETE_FAILED: 'Failed to delete Descope user',
    DESCOPE_USER_DELETE_COMPLETED: 'Descope user deleted successfully',
    EMAIL_SEND_STARTED: 'Email sending process started',
    EMAIL_SEND_COMPLETED: 'Email sent successfully',
    EMAIL_SEND_FAILED: 'Failed to send email',
    EMAIL_HTML_GENERATION_STARTED: 'Email HTML generation started',
    EMAIL_HTML_GENERATION_COMPLETED: 'Email HTML generated successfully',
    MAGIC_LINK_GENERATION_STARTED: 'Magic link generation started',
    MAGIC_LINK_GENERATION_FAILED: 'Failed to generate magic link',
    MAGIC_LINK_GENERATION_COMPLETED: 'Magic link generated successfully',
    REDIRECT_TO_HOME: 'Redirecting to home page',
    REDIRECT_TO_MFA: 'Redirecting to MFA verification page',
    REDIRECT_TO_ERROR: 'Redirecting to error page',
    ENV_VARS_MISSING: 'Required environment variables are missing',
    USER_EMAIL_MISSING: 'User email is missing',
    CODE_MISSING: 'Authorization code is missing',
  },
} as const
