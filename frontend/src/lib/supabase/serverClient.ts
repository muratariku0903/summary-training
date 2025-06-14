import { createClient } from '@supabase/supabase-js'

const isDocGen = process.env.GENERATE_OPENAPI === 'true'

//　サーバーサイド用クライアント

export const serverClient = createClient(
  isDocGen ? 'http://localhost:54321' : process.env.SUPABASE_URL!,
  isDocGen ? 'dummy-anon-key-for-docs' : process.env.SUPABASE_SERVICE_ROLE_KEY!
)
