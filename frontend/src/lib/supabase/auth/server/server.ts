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

/**
 * 現在の認証ユーザーIDを取得
 * ログインしていない場合はundefinedを返す
 */
export async function getUserId(): Promise<string | undefined> {
  try {
    const client = await createServerComponentClient()
    const {
      data: { session },
    } = await client.auth.getSession()

    return session?.user?.id
  } catch (error) {
    throw error
  }
}
