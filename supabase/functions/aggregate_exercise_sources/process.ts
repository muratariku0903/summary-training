import { z } from 'zod'
import { baseRequestSchema } from '../_shared/http/request.ts'
import { AGGREGATE_TYPES } from '../_shared/types/exercise_generator_sources.ts'
import { RawShapeOf, RunJobParams } from '../_shared/job_runner.ts'
import {
  SQL_ACQUIRE_LOCK_THEME_SOURCES,
  SQL_INSERT_SEED_SOURCE_LINKS_BY_THEME,
  SQL_SEED_SOURCE_AGGREGATION_STATUS_BY_THEME,
  SQL_UPSERT_SOURCES_BY_THEMES,
} from '../_shared/usecase/aggregate_exercise_sources/sql.ts'
import { DirectlyExecutingQueryError } from '../_shared/error/error.ts'
import { logger } from '../_shared/log/log.ts'
import { deps } from './deps.ts'

export const reqSchema = baseRequestSchema.extend({
  aggregate_type: z.nativeEnum(AGGREGATE_TYPES),
})
export type ShapeOfReqSchema = RawShapeOf<typeof reqSchema>

export const createJobProcess = (d = deps) => {
  const jobProcess: RunJobParams<ShapeOfReqSchema>['jobProcess'] = async (_, params) => {
    const { aggregate_type } = params
    logger.debug('aggregate_type: ', aggregate_type)

    const { success, data, error } = await d.run({
      pool: d.getPoolClient(),
      acquireLockQuery: SQL_ACQUIRE_LOCK_THEME_SOURCES,
      exec: async (client) => {
        // 1) テーマに対応する Source をUpsert
        try {
          await client.queryObject(SQL_UPSERT_SOURCES_BY_THEMES)
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
          await client.queryObject(SQL_INSERT_SEED_SOURCE_LINKS_BY_THEME)
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
            rows: {
              theme_id: string
              linked_seeds: number
              target_seeds: number
            }[]
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
          extra: JSON.parse(JSON.stringify(data)),
        },
      },
    }
  }

  return jobProcess
}

export const jobProcess = createJobProcess()
