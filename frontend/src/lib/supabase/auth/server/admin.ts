import { adminClient } from '../client/adminClient'

/**
 * email で auth.users を探し、見つかったら UUID を返す（大小無視）
 */
export async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const target = email.trim().toLowerCase()
  let page = 1
  const perPage = 1000 // docs: 最大1000/ページ（環境により調整）:contentReference[oaicite:1]{index=1}

  for (;;) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data?.users ?? []

    const hit = users.find((u) => (u.email ?? '').toLowerCase() === target)
    if (hit?.id) return hit.id

    if (users.length < perPage) break // 最終ページ
    page += 1
  }
  return null
}

/**
 * auth.users.id → idp_links から Descope の userId(sub) を取得
 */
export async function getDescopeUserIdByAuthUserId(
  authUserId: string,
): Promise<
  | { success: true; descopeUserId: string | null; message?: never }
  | { success: false; descopeUserId?: never; message: string }
> {
  const { data, error } = await adminClient
    .from('idp_links')
    .select('external_user_id')
    .eq('provider', 'descope')
    .eq('auth_user_id', authUserId)
    .limit(1)

  if (error) return { success: false, message: error.message }
  
  return { success: true, descopeUserId: data?.[0]?.external_user_id ?? null }
}
