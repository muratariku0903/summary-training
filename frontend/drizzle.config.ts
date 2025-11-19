import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'

config({ path: '.env' })

export default {
  schema: './src/lib/drizzle/schema/schema.ts', // Drizzleスキーマの出力先
  out: './src/lib/drizzle/schema', // マイグレーションファイルの出力先
  dialect: 'postgresql',
  dbCredentials: {
    url: `postgresql://postgres.${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}:${process.env.SUPABASE_DATABASE_PASSWORD_DEV}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`,
    ssl: true,
  },
} satisfies Config
