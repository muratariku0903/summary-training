import { InternalError } from '@/lib/api/response'
import { withLogger } from '@/lib/api/wrapper'

export const dynamic = 'force-dynamic'

export const GET = withLogger(async (request, { logger }) => {
  logger.info(request.url)
  logger.info('test', { user_email: 'sample@gmail.com', password: 'passw0rd' })
  logger.error('test error', Error('test error'))

  return InternalError().toResponse()
})
