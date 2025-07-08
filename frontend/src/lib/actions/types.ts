export type ActionResult<T = void> =
  | {
      status: 'none'
      data: T
      error?: never
    }
  | {
      status: 'success'
      data: T
      error?: never
    }
  | {
      status: 'error'
      data: T
      error: string
    }
