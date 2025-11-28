import * as Sentry from '@sentry/nextjs'

export const notifySentry = (error: Error, hint?: object) =>
  Sentry.captureException(error, hint)
