import { z } from 'https://esm.sh/zod@3.23.8'
import { jsonErr, jsonOk } from '../_shared/http/http.ts'
import { run } from '../_shared/db/process.ts'
import { AGGREGATE_TYPES } from '../_shared/types/exercise_generator_sources.ts'
import { POOL } from '../_shared/db/client.ts'
import { RawShapeOf, runJob, RunJobParams } from '../_shared/job_runner.ts'
import {
  DirectlyExecutingQueryError,
  InvalidRequestError,
} from '../_shared/error/error.ts'
import { logger } from '../_shared/log/log.ts'
import { Database } from '../_shared/types/database.ts'
import { createClient } from '@supabase/supabase-js'
import { JOB_NAMES } from '../_shared/const.ts'
import {
  SQL_ACQUIRE_LOCK_THEME_SOURCES,
  SQL_INSERT_SEED_SOURCE_LINKS_BY_THEME,
  SQL_SEED_SOURCE_AGGREGATION_STATUS_BY_THEME,
  SQL_UPSERT_SOURCES_BY_THEMES,
} from '../_shared/usecase/aggregate_exercise_sources/sql.ts'
import { baseRequestSchema } from '../_shared/http/request.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const reqSchema = baseRequestSchema.extend({
  aggregate_type: z.nativeEnum(AGGREGATE_TYPES),
})
type ShapeOfReqSchema = RawShapeOf<typeof reqSchema>

Deno.serve(async (req) => {
  logger.debug('req: ', req)

  if (CRON_SECRET) {
    const given = req.headers.get('x-cron-secret')
    if (given !== CRON_SECRET) return jsonErr({ ok: false, error: 'unauthorized' }, 401)
  }

  try {
    const params: RunJobParams<ShapeOfReqSchema> = {
      req,
      supabase,
      reqSchema,
      jobKey: JOB_NAMES.AGGREGATE_EXERCISE_SOURCES,
      jobProcess,
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

const jobProcess: RunJobParams<ShapeOfReqSchema>['jobProcess'] = async (params) => {
  const { aggregate_type } = params
  logger.debug('aggregate_type: ', aggregate_type)

  const { success, data, error } = await run({
    pool: POOL,
    acquireLockQuery: SQL_ACQUIRE_LOCK_THEME_SOURCES,
    exec: async (client) => {
      // 1) テーマに対応する Source をUpsert
      try {
        await client.queryObject<{ id: string; theme_id: string }>(
          SQL_UPSERT_SOURCES_BY_THEMES,
        )
      } catch (e) {
        logger.error('[SQL_UPSERT_SOURCES_BY_THEMES]でエラーが発生', e)
        return {
          success: false,
          error: new DirectlyExecutingQueryError(
            jobProcess.name,
            e,
            SQL_UPSERT_SOURCES_BY_THEMES,
          ),
        }
      }

      // 2) 未リンクの Seed を一括リンク
      try {
        await client.queryObject<{ source_id: string; seed_id: string }>(
          SQL_INSERT_SEED_SOURCE_LINKS_BY_THEME,
        )
      } catch (e) {
        logger.error('[SQL_INSERT_SEED_SOURCE_LINKS_BY_THEME]でエラーが発生', e)
        return {
          success: false,
          error: new DirectlyExecutingQueryError(
            jobProcess.name,
            e,
            SQL_INSERT_SEED_SOURCE_LINKS_BY_THEME,
          ),
        }
      }

      // 3) 参考メトリクス取得（任意）
      try {
        const metrics = await client.queryObject<{
          theme_id: string
          linked_seeds: number
          target_seeds: number
        }>(SQL_SEED_SOURCE_AGGREGATION_STATUS_BY_THEME)
        return { success: true, data: { aggregate_type, metrics } }
      } catch (e) {
        logger.error('[SQL_SEED_SOURCE_AGGREGATION_STATUS_BY_THEME]でエラーが発生', e)
        return {
          success: false,
          error: new DirectlyExecutingQueryError(
            jobProcess.name,
            e,
            SQL_SEED_SOURCE_AGGREGATION_STATUS_BY_THEME,
          ),
        }
      }
    },
  })
  if (!success) {
    return { success: false, error }
  }

  return {
    success: true,
    data: {
      status: 'success',
      metrics: {
        storage: [],
        db: [],
        errors: [],
        extra: JSON.parse(JSON.stringify(data)),
      },
    },
  }
}
