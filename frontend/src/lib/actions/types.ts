export type ActionResult<T = void> =
  | {
      success: true
      data: T
      error?: never
    }
  | {
      success: false
      data?: never
      error: string
    }
