import { SupabaseClient, User } from '@supabase/supabase-js'
import { createServerComponentClient } from '../../client/serverComponentClient'

/**
 * ユーザー情報が適切なセッション情報を保持してるかチェック
 */
export async function checkValidSessionLevel(
  user: User,
  client?: SupabaseClient,
): Promise<
  | { valid: boolean; error?: never }
  | {
      valid?: never
      error: string
    }
> {
  try {
    if (!client) {
      client = await createServerComponentClient()
    }

    const verifiedFactors = user?.factors?.filter((f) => f.status === 'verified')
    if (verifiedFactors && verifiedFactors.length > 0) {
      const { data } = await client.auth.mfa.getAuthenticatorAssuranceLevel()
      if (data?.currentLevel !== 'aal2') {
        return { valid: false }
      }
    }

    return { valid: true }
  } catch (e) {
    return { error: String(e) }
  }
}
