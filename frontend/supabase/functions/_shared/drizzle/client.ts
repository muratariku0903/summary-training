import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const SUPABASE_DB_URL = Deno.env.get('SUPABASE_DB_URL')!

const sql = postgres(SUPABASE_DB_URL, { prepare: false })

export const drizzleDB = drizzle(sql)
