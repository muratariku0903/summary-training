import { createClient } from '@supabase/supabase-js'
import { Pool } from 'https://deno.land/x/postgres@v0.17.2/mod.ts'
import { Database } from '../types/db_schema.ts'

export const TRANSACTION_POOLER_URL = Deno.env.get('TRANSACTION_POOLER_URL')!

export const getPoolClient = () => {
  // プールは関数外で作成（コールドスタート後の再利用）
  // プールサイズ
  // 同時に保持するコネクション数の上限
  // リクエストが4つ以上来た場合、空きコネクションができるまで待機
  // lazy接続
  // 遅延接続を有効にする設定
  // true: 実際に必要になるまでコネクションを作成しない
  // false: プール作成時に全コネクションを即座に作成
  return new Pool(TRANSACTION_POOLER_URL, 3, true)
}

export const getSupabaseClient = () => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}
