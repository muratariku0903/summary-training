export class Logger {
  static start(funcName: string) {
    console.log(`${funcName}: start`)
  }

  static end(funcName: string) {
    console.log(`${funcName}: end`)
  }

  static error(funcName: string, error: unknown) {
    if (error instanceof Error) {
      console.error(`${funcName}: error - ${error.message}`, error)
    } else if (typeof error === 'string') {
      console.error(`${funcName}: error - ${error}`)
    } else {
      console.error(`${funcName}: error -`, error)
    }
  }
}

/**
 * 文字列から改行文字を削除する
 * @param input - サニタイズする文字列
 * @returns 改行文字が削除された文字列
 */
export const sanitizeLog = (input: string): string => {
  if (!input) {
    return ''
  }
  // \n (LF) と \r (CR) を空文字列に置換
  return input.replace(/[\n\r]/g, '')
}
