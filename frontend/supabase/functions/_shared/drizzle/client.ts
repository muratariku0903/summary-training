import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const TRANSACTION_POOLER_URL = Deno.env.get('TRANSACTION_POOLER_URL')!

const sql = postgres(TRANSACTION_POOLER_URL, {
  max: 1,
  idle_timeout: 0,
  connect_timeout: 10,
  prepare: false,
})

export const drizzleDB = drizzle(sql)

// 接続テスト関数
export async function testConnection() {
  try {
    await sql`SELECT 1`
    console.log('Database connection successful')
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}
