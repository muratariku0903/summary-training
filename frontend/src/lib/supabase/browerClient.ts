import { createBrowserClient } from '@supabase/ssr'

const isDocGen = process.env.GENERATE_OPENAPI === 'true'

//　ブラウザ用クライアント
export const browserClient = createBrowserClient(
  isDocGen ? 'http://localhost:54321' : process.env.SUPABASE_URL!,
  isDocGen ? 'dummy-anon-key-for-docs' : process.env.SUPABASE_ANON_KEY!
)
