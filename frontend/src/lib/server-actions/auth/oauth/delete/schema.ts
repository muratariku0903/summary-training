import { AUTH_PROVIDERS } from '@/lib/supabase/auth/types'
import z from 'zod'

// バリデーションスキーマ
export const deleteOAuthSchema = z.object({
  provider: z.nativeEnum(AUTH_PROVIDERS),
})
export type DeleteOAuthSchema = z.infer<typeof deleteOAuthSchema>
