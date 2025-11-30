import { PUBLIC_PATHS } from '@/lib/constants/routes'
import { createServerComponentClient } from '@/lib/supabase/client/serverComponentClient'
import { UserProfile } from '@/lib/supabase/schema/utils'
import { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export async function getUserProfile(): Promise<{ user: User; profile: UserProfile }> {
  const serverComponentClient = await createServerComponentClient()

  // 認証状態をチェック
  const {
    data: { user },
    error: authError,
  } = await serverComponentClient.auth.getUser()

  if (authError || !user) {
    console.error('認証エラー:', authError)
    redirect(PUBLIC_PATHS.SIGNIN)
  }

  // プロフィール情報を取得
  const { data: profile, error: profileError } = await serverComponentClient
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (profileError) {
    console.error('プロフィール作成エラー:', profileError)
    redirect(PUBLIC_PATHS.SIGNIN)
  }

  return { user, profile }
}
