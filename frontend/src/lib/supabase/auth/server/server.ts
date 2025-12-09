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
 *
 * @description
 * getSession()ではなくgetUser()を使用してサーバー側で認証を検証
 * getSession()はクッキーから直接取得するため、改ざんされている可能性がある
 */
export async function getUserId(): Promise<string | undefined> {
  try {
    const client = await createServerComponentClient()

    // getSession()でアクセストークンを取得
    const {
      data: { session },
    } = await client.auth.getSession()

    // セッションがない場合は早期リターン
    if (!session?.access_token) {
      return undefined
    }

    // getUser()でトークンを検証してユーザー情報を取得
    const {
      data: { user },
      error,
    } = await client.auth.getUser(session.access_token)

    if (error || !user) {
      return undefined
    }

    return user.id
  } catch {
    return undefined
  }
}
