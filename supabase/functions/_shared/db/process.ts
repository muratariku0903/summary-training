import { Pool } from 'https://deno.land/x/postgres@v0.17.2/pool.ts'
import { Result } from '../types/common.ts'
import { PoolClient } from 'https://deno.land/x/postgres@v0.17.2/client.ts'
import { logger } from '../log/log.ts'
import { BaseError, DatabaseQueryError, UnexpectedError } from '../error/error.ts'

type RunParams<T> = {
  pool: Pool
  exec: (client: PoolClient) => Promise<Result<T, BaseError>>
  acquireLockQuery?: string
}
export const run = async <T>(params: RunParams<T>): Promise<Result<T, BaseError>> => {
  logger.start(run.name)

  const { pool, exec, acquireLockQuery } = params
  const client = await pool.connect()

  try {
    // トランザクションの開始
    await client.queryArray`begin`
    logger.info('transaction start')

    // 排他ロック（多重起動回避）
    if (acquireLockQuery) {
      const lockRes = await client.queryObject<{ locked: boolean }>(acquireLockQuery)
      if (!lockRes.rows[0]?.locked) {
        await client.queryArray`rollback`

        return {
          success: false,
          error: new DatabaseQueryError(
            run.name,
            'SELECT',
            undefined,
            `query: ${acquireLockQuery}`,
            '排他ロック（多重起動回避）の取得に失敗しました',
          ),
        }
      }
      logger.info('transaction locked')
    }

    const { success: execSuccess, data: execData, error: execError } = await exec(client)
    if (!execSuccess) {
      logger.error('exec error: ', execError)
      return { success: false, error: execError }
    }

    await client.queryArray`commit`
    logger.info('transaction commit')

    return {
      success: true,
      data: execData,
    }
  } catch (e) {
    logger.error('run sql error: ', e)
    try {
      await client.queryArray`rollback`
      logger.info('transaction rollback')
    } catch {
      /* noop */
    }
    return { success: false, error: new UnexpectedError(run.name, e) }
  } finally {
    client.release()
    logger.end(run.name)
  }
}

// PostgreSQLの関数で、トランザクション単位のアドバイザリロックを取得
export const createAdvisoryLockQuery = (lockIdentifier: string) => `
  select pg_try_advisory_xact_lock(hashtext('${lockIdentifier}')) as locked
`
