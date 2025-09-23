import { Pool } from 'https://deno.land/x/postgres@v0.17.2/pool.ts'
import { Result } from '../types/common.ts'
import { PoolClient } from 'https://deno.land/x/postgres@v0.17.2/client.ts'

type RunOnceParams<T> = {
  pool: Pool
  acquireLockQuery: string
  exec: (client: PoolClient) => Promise<T>
}
export const runOnce = async <T>(params: RunOnceParams<T>): Promise<Result<T>> => {
  const { pool, acquireLockQuery, exec } = params
  const client = await pool.connect()

  try {
    // トランザクションの開始
    await client.queryArray`begin`
    console.log('transaction start')

    // 排他ロック（多重起動回避）
    const lockRes = await client.queryObject<{ locked: boolean }>(acquireLockQuery)
    if (!lockRes.rows[0]?.locked) {
      await client.queryArray`rollback`

      return { success: false, error: Error('another-run-in-progress') }
    }
    console.log('transaction locked')

    const result = await exec(client)

    await client.queryArray`commit`
    console.log('transaction commit')

    return {
      success: true,
      data: result,
    }
  } catch (e) {
    console.error('error', '[aggregate] error:', e)
    try {
      await client.queryArray`rollback`
      console.log('transaction rollback')
    } catch {
      /* noop */
    }
    return { success: false, error: Error(String(e)) }
  } finally {
    client.release()
  }
}

// PostgreSQLの関数で、トランザクション単位のアドバイザリロックを取得
export const createAdvisoryLockQuery = (lockIdentifier: string) => `
  select pg_try_advisory_xact_lock(hashtext('${lockIdentifier}')) as locked
`
