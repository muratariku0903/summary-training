import { pgTable, uuid } from 'drizzle-orm/pg-core'

// users テーブルはauthスキーマに存在します
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().notNull(), // usersテーブルの id カラム
    // users テーブルの他の必要なカラム（通常は不要）
  },
  () => {
    // スキーマがauthであることを明示
    return {
      schema: 'auth',
    }
  },
)
