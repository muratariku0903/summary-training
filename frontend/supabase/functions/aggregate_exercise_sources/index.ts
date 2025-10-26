import { jsonErr, jsonOk } from '../_shared/http/http.ts'
import { getSupabaseClient } from '../_shared/db/client.ts'
import { runJob, RunJobParams } from '../_shared/job_runner.ts'
import { InvalidRequestError } from '../_shared/error/error.ts'
import { logger } from '../_shared/log/log.ts'
import { JOB_NAMES } from '../_shared/const.ts'
import { jobProcess, reqSchema, ShapeOfReqSchema } from './process.ts'

const CRON_SECRET = Deno.env.get('CRON_SECRET')

Deno.serve(async (req) => {
  logger.debug('req: ', req)

  if (CRON_SECRET) {
    const given = req.headers.get('x-cron-secret')
    if (given !== CRON_SECRET) return jsonErr({ ok: false, error: 'unauthorized' }, 401)
  }

  const supabase = getSupabaseClient()

  try {
    const params: RunJobParams<ShapeOfReqSchema> = {
      req,
      supabase,
      reqSchema,
      jobKey: JOB_NAMES.AGGREGATE_EXERCISE_SOURCES,
      jobProcess,
      enableMultiJob: false,
      disableConcurrentlyRunJobs: [
        JOB_NAMES.GENERATE_SEED_THEMES,
        JOB_NAMES.GENERATE_EXERCISE_SEEDS,
        JOB_NAMES.GENERATE_EXERCISES,
      ],
    }
    const { success, data, error } = await runJob(params)
    if (!success) {
      return jsonErr(error, error instanceof InvalidRequestError ? 400 : 500)
    }

    return jsonOk({ data })
  } catch (e) {
    logger.error('想定外のエラー', e)
    return jsonErr(e, 500)
  }
})
