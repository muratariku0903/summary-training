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
