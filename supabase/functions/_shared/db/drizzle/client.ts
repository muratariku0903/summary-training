import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const TRANSACTION_POOLER_URL = Deno.env.get('TRANSACTION_POOLER_URL')!
export const getDrizzleDBClient = () => {
  const sql = postgres(TRANSACTION_POOLER_URL, {
    max: 1,
    idle_timeout: 0,
    connect_timeout: 10,
    prepare: false,
  })

  const drizzleDB = drizzle(sql)

  return drizzleDB
}
