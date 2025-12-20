// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference lib="deno.ns" />

import {
  assertEquals,
  assertInstanceOf,
} from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { createJobProcess } from '../../../functions/aggregate_exercise_sources/process.ts'
import {
  SQL_UPSERT_SOURCES_BY_THEMES,
  SQL_INSERT_SEED_SOURCE_LINKS_BY_THEME,
  SQL_SEED_SOURCE_AGGREGATION_STATUS_BY_THEME,
} from '../../../functions/_shared/usecase/aggregate_exercise_sources/sql.ts'
import { AGGREGATE_TYPES } from '../../../functions/_shared/types/exercise_generator_sources.ts'
import { DirectlyExecutingQueryError } from '../../_shared/error/error.ts'

Deno.test('aggregate_exercise_sources/process.ts', async (t) => {
  await t.step('正常系: 3つのSQLが順に成功 → status=success', async () => {
    const fakeDeps = {
      getPoolClient: () => ({}) as any,
      run: async (args: any) => {
        const mockClient = {
          queryObject: (sql: string) => {
            if (sql === SQL_UPSERT_SOURCES_BY_THEMES) {
              return { rows: [{ id: 'src-1', theme_id: 'th-1' }] }
            }
            if (sql === SQL_INSERT_SEED_SOURCE_LINKS_BY_THEME) {
              return { rows: [{ source_id: 'src-1', seed_id: 'seed-1' }] }
            }
            if (sql === SQL_SEED_SOURCE_AGGREGATION_STATUS_BY_THEME) {
              return { rows: [{ theme_id: 'th-1', linked_seeds: 1, target_seeds: 1 }] }
            }
            return { rows: [] }
          },
        }
        return await args.exec(mockClient)
      },
    }

    const jobProcess = createJobProcess(fakeDeps)
    const res = await jobProcess({} as any, {
      job_run_mode: 'test',
      aggregate_type: AGGREGATE_TYPES.THEME,
    })

    assertEquals(res.success, true)
    if (res.success) {
      assertEquals(res.data.status, 'success')
      assertEquals(
        res.data.metrics.extra,
        JSON.parse(
          JSON.stringify({
            aggregate_type: 'theme',
            metrics: { rows: [{ theme_id: 'th-1', linked_seeds: 1, target_seeds: 1 }] },
          }),
        ),
      )
    }
  })

  await t.step(
    '異常系: Q1(UPSERT_SOURCES)で失敗 → DirectlyExecutingQueryError',
    async () => {
      const fakeDeps = {
        getPoolClient: () => ({}) as any,
        run: async (args: any) => {
          const mockClient = {
            queryObject: (sql: string) => {
              if (sql === SQL_UPSERT_SOURCES_BY_THEMES) {
                throw new Error('q1 failed')
              }
              return { rows: [] }
            },
          }
          return await args.exec(mockClient)
        },
      }

      const jobProcess = createJobProcess(fakeDeps)
      const res = await jobProcess({} as any, {
        job_run_mode: 'test',
        aggregate_type: AGGREGATE_TYPES.THEME,
      })

      assertEquals(res.success, false)
      assertInstanceOf(res.error, DirectlyExecutingQueryError)
    },
  )

  await t.step(
    '異常系: Q2(SQL_INSERT_SEED_SOURCE_LINKS)で失敗 → DirectlyExecutingQueryError',
    async () => {
      const fakeDeps = {
        getPoolClient: () => ({}) as any,
        run: async (args: any) => {
          const mockClient = {
            queryObject: (sql: string) => {
              if (sql === SQL_UPSERT_SOURCES_BY_THEMES) {
                return { rows: [{ id: 'src-1', theme_id: 'th-1' }] }
              }
              if (sql === SQL_INSERT_SEED_SOURCE_LINKS_BY_THEME) {
                throw new Error('q2 failed')
              }
              return { rows: [] }
            },
          }
          return await args.exec(mockClient)
        },
      }

      const jobProcess = createJobProcess(fakeDeps)
      const res = await jobProcess({} as any, {
        job_run_mode: 'test',
        aggregate_type: AGGREGATE_TYPES.THEME,
      })

      assertEquals(res.success, false)
      assertInstanceOf(res.error, DirectlyExecutingQueryError)
    },
  )

  await t.step(
    '異常系: Q3(SQL_SEED_SOURCE_AGGREGATION_STATUS)で失敗 → DirectlyExecutingQueryError',
    async () => {
      const fakeDeps = {
        getPoolClient: () => ({}) as any,
        run: async (args: any) => {
          const mockClient = {
            queryObject: (sql: string) => {
              if (sql === SQL_UPSERT_SOURCES_BY_THEMES) {
                return { rows: [{ id: 'src-1', theme_id: 'th-1' }] }
              }
              if (sql === SQL_INSERT_SEED_SOURCE_LINKS_BY_THEME) {
                return { rows: [{ source_id: 'src-1', seed_id: 'seed-1' }] }
              }
              if (sql === SQL_SEED_SOURCE_AGGREGATION_STATUS_BY_THEME) {
                throw new Error('q3 failed')
              }
              return { rows: [] }
            },
          }
          return await args.exec(mockClient)
        },
      }

      const jobProcess = createJobProcess(fakeDeps)
      const res = await jobProcess({} as any, {
        job_run_mode: 'test',
        aggregate_type: AGGREGATE_TYPES.THEME,
      })

      assertEquals(res.success, false)
      assertInstanceOf(res.error, DirectlyExecutingQueryError)
    },
  )
})
