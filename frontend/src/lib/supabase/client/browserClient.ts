/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBrowserClient } from '@supabase/ssr'

const CLIENT_INSTANCE_ID = `browserClient:${Math.random().toString(16).slice(2)}`
console.log('[SUPABASE] browserClient instance', { CLIENT_INSTANCE_ID })

/**
 * Supabase内部で使われるstorageを監視する
 * - getSession() が storage 読みで止まってないか
 * - セッションキーが読めているか
 */
const monitoredStorage = {
  getItem: (key: string) => globalThis.localStorage.getItem(key),
  setItem: (key: string, value: string) => globalThis.localStorage.setItem(key, value),
  removeItem: (key: string) => globalThis.localStorage.removeItem(key),
}

// 用途: 主にブラウザ環境（Webアプリケーションのフロントエンドなど）で使用されます。
// 認証キー: process.env.SUPABASE_ANON_KEY! を使用します。これは Supabase の Anon Key (公開匿名キー) であり、サービスにアクセスする際の最低限の権限を提供します。このキーは誰でも利用できるように設計されており、データの読み取りなど、限定された操作のみを許可します。
// セキュリティ: ブラウザで実行されるため、このクライアントを通じて行われる操作は Supabase の Row Level Security (RLS) ポリシーによって厳しく制限されます。これにより、意図しないデータアクセスや改ざんを防ぎます。
export const browserClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: monitoredStorage,
      debug: (...args: any[]) => {
        // GoTrueClientの _debug がここに流れてくる
        console.log('[SUPABASE][AUTH-DEBUG]', { CLIENT_INSTANCE_ID }, ...args)
      },
    },
  },
)
