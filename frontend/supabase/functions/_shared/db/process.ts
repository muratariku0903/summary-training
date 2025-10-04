import { Pool } from 'https://deno.land/x/postgres@v0.17.2/pool.ts'
import { Result } from '../types/common.ts'
import { PoolClient } from 'https://deno.land/x/postgres@v0.17.2/client.ts'
import { logger } from '../log/log.ts'

type RunParams<T> = {
  pool: Pool
  exec: (client: PoolClient) => Promise<T>
  acquireLockQuery?: string
}
export const run = async <T>(params: RunParams<T>): Promise<Result<T>> => {
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

        return { success: false, error: Error('another-run-in-progress') }
      }
      logger.info('transaction locked')
    }

    const result = await exec(client)

    await client.queryArray`commit`
    logger.info('transaction commit')

    return {
      success: true,
      data: result,
    }
  } catch (e) {
    logger.error('run sql error: ', e)
    try {
      await client.queryArray`rollback`
      logger.info('transaction rollback')
    } catch {
      /* noop */
    }
    return { success: false, error: Error(String(e)) }
  } finally {
    client.release()
    logger.end(run.name)
  }
}

// PostgreSQLの関数で、トランザクション単位のアドバイザリロックを取得
export const createAdvisoryLockQuery = (lockIdentifier: string) => `
  select pg_try_advisory_xact_lock(hashtext('${lockIdentifier}')) as locked
`
