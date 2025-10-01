import { Pool } from 'https://deno.land/x/postgres@v0.17.2/mod.ts'

export const TRANSACTION_POOLER_URL = Deno.env.get('TRANSACTION_POOLER_URL')!

// プールは関数外で作成（コールドスタート後の再利用）
// プールサイズ
// 同時に保持するコネクション数の上限
// リクエストが4つ以上来た場合、空きコネクションができるまで待機
// lazy接続
// 遅延接続を有効にする設定
// true: 実際に必要になるまでコネクションを作成しない
// false: プール作成時に全コネクションを即座に作成
export const POOL = new Pool(TRANSACTION_POOLER_URL, 3, true)
