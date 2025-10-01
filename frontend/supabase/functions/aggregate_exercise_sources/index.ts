import { z } from 'https://esm.sh/zod@3.23.8'
import { jsonErr, jsonOk } from '../_shared/http/http.ts'
import { run } from '../_shared/db/process.ts'
import {
  SQL_ACQUIRE_LOCK_THEME_SOURCES,
  SQL_INSERT_SEED_SOURCE_LINKS_BY_THEME,
  SQL_SEED_SOURCE_AGGREGATION_STATUS_BY_THEME,
  SQL_UPSERT_SOURCES_BY_THEMES,
} from './_shared/sql.ts'
import { AGGREGATE_TYPES } from '../_shared/types/exercise_generator_sources.ts'
import { POOL } from '../_shared/db/client.ts'

const CRON_SECRET = Deno.env.get('CRON_SECRET')

const reqSchema = z.object({
  aggregate_type: z.nativeEnum(AGGREGATE_TYPES),
})

Deno.serve(async (req) => {
  try {
    if (CRON_SECRET) {
      const given = req.headers.get('x-cron-secret')
      if (given !== CRON_SECRET) {
        return jsonErr({ ok: false, error: 'unauthorized' }, 401)
      }
    }

    console.log('req: ', req)
    const body = await req
      .json()
      .catch(() => console.error('fail to json from request', req))
    const {
      success: parseSuccess,
      data: parseData,
      error: parseError,
    } = reqSchema.safeParse(body)
    if (!parseSuccess) {
      return jsonErr({ ok: false, error: String(parseError) }, 400)
    }
    const { aggregate_type } = parseData
    console.log('aggregate_type: ', aggregate_type)

    const { success, data, error } = await run({
      pool: POOL,
      acquireLockQuery: SQL_ACQUIRE_LOCK_THEME_SOURCES,
      exec: async (client) => {
        // // 1) テーマに対応する Source をUpsert
        await client.queryObject<{ id: string; theme_id: string }>(
          SQL_UPSERT_SOURCES_BY_THEMES,
        )
        console.log('success source upsert')

        // 2) 未リンクの Seed を一括リンク
        await client.queryObject<{ source_id: string; seed_id: string }>(
          SQL_INSERT_SEED_SOURCE_LINKS_BY_THEME,
        )
        console.log('success insert link seed source')

        // 3) 参考メトリクス取得（任意）
        const metrics = await client.queryObject<{
          theme_id: string
          linked_seeds: number
          target_seeds: number
        }>(SQL_SEED_SOURCE_AGGREGATION_STATUS_BY_THEME)

        return { aggregate_type, metrics }
      },
    })
    if (!success) {
      return jsonErr({ ok: false, error: error }, 500)
    }

    return jsonOk({ ok: true, metric: data })
  } catch (e) {
    console.error('unexpected error', e)
    return jsonErr({ ok: false, error: String(e) }, 500)
  }
})
