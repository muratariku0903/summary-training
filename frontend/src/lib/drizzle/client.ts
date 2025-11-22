import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

export type DrizzleDB = PostgresJsDatabase<Record<string, never>>
export const getDrizzleDBClient = () => {
  const sql = postgres(process.env.SUPABASE_SESSION_POOLER_URL!, {
    max: 1,
    idle_timeout: 0,
    connect_timeout: 10,
    prepare: false,
    ssl: 'require',
  })

  const drizzleDB = drizzle(sql)

  return drizzleDB
}
