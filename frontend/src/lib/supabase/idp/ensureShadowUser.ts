import { findAuthUserIdByEmail } from '../auth/admin'
import { adminClient } from '../client/adminClient'

export type EnsureArgs = {
  provider: 'descope' | string
  externalUserId: string // Descopeの sub
  email: string // verified のみ利用
  emailVerified?: boolean
}

export type EnsureOk = {
  success: true
  authUserId: string
  code?: never
  message?: never
}
export type EnsureErrCode =
  | 'link_lookup_failed'
  | 'user_found' // 既存ユーザーを見つけた（内部用）
  | 'user_search_failed'
  | 'create_user_failed'
  | 'link_upsert_failed'
  | 'invalid_args'
export type EnsureErr = {
  success: false
  authUserId?: never
  code: EnsureErrCode
  message: string
}
export type EnsureResult = EnsureOk | EnsureErr

/**
 * 外部ID(sub)→ Supabase UUID を解決する。
 * 1) 既存リンク表ヒット → そのUUID
 * 2) 無ければ email(verified) で既存auth.users探索 → あればそれを採用
 * 3) どちらも無ければ auth.users を新規作成 → UUID
 * 4) 最後にリンク表を upsert
 */
export const ensureShadowUser = async (args: EnsureArgs): Promise<EnsureResult> => {
  const provider = args.provider?.trim()
  const externalUserId = args.externalUserId?.trim()
  if (!provider || !externalUserId) {
    return { success: false, code: 'invalid_args', message: 'provider/sub required' }
  }

  // 1) 既存リンク表ヒット?
  const { data: linkRows, error: linkErr } = await adminClient
    .from('idp_links')
    .select('auth_user_id')
    .eq('provider', provider)
    .eq('external_user_id', externalUserId)
    .limit(1)
  if (linkErr) {
    return { success: false, code: 'link_lookup_failed', message: linkErr.message }
  }
  if (linkRows && linkRows.length > 0 && linkRows[0]?.auth_user_id) {
    return { success: true, authUserId: linkRows[0].auth_user_id }
  }

  // 2) email(verified)で既存auth.users探索
  const { emailVerified, email } = args
  let authUserId: string | null = null
  if (emailVerified) {
    try {
      authUserId = await findAuthUserIdByEmail(email)
    } catch (e: unknown) {
      console.error(e)
      return {
        success: false,
        code: 'user_search_failed',
        message: 'listUsers failed',
      }
    }
  }

  // 3) 見つからなければ作成
  if (!authUserId) {
    const created = await adminClient.auth.admin.createUser({
      email: email || undefined,
      email_confirm: !!args.emailVerified,
      user_metadata: { provider, externalUserId },
    })
    if (created.error || !created.data?.user?.id) {
      return {
        success: false,
        code: 'create_user_failed',
        message: created.error?.message || 'createUser failed',
      }
    }
    authUserId = created.data.user.id
  }

  // 4) リンク表 upsert
  const { error: upsertErr } = await adminClient
    .from('idp_links')
    .upsert(
      {
        provider,
        external_user_id: externalUserId,
        auth_user_id: authUserId,
        email_at_link_time: email || null,
        metadata: { from: provider },
        // last_seen_at はログインごとに別途 update でもOK
      },
      {
        onConflict: 'provider,external_user_id', // ← unique制約と一致させる
        ignoreDuplicates: false, // 衝突時は UPDATE（デフォルト）
      },
    )
    .select('auth_user_id') // ← 付けておくとエラー内容が拾いやすい
  // .single() は不要（戻りは配列）

  if (upsertErr) {
    return { success: false, code: 'link_upsert_failed', message: upsertErr.message }
  }

  return { success: true, authUserId }
}
