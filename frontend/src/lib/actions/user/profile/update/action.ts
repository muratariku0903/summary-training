'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { UserProfile, UserProfileUpdate } from '../../../../supabase/schema/utils'
import { PROTECTED_PATHS, PUBLIC_PATHS } from '../../../../constants/routes'
import { createClient } from '../../../../supabase/client/serverComponentClient'
import { ActionResult } from '../../../types'
import { UpdateProfileSchema } from './schema'

// プロフィール更新のサーバーアクション
export const updateProfileAction = async (
  input: UpdateProfileSchema
): Promise<ActionResult<UserProfile>> => {
  try {
    const serverComponentClient = await createClient()

    // 認証チェック(JWTの改ざんチェック)
    const {
      data: { user },
      error: authError,
    } = await serverComponentClient.auth.getUser()
    if (authError || !user) {
      console.error(authError)
      redirect(PUBLIC_PATHS.SIGNIN)
    }

    // データベースを更新
    const updateData: UserProfileUpdate = {
      user_name: input.user_name,
      display_name: input.display_name,
      bio: input.bio || null,
    }
    const { data, error } = await serverComponentClient
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()
    if (error) {
      console.error('Profile update error:', error)
      return {
        success: false,
        error: 'プロフィールの更新に失敗しました',
      }
    }

    // キャッシュを更新
    revalidatePath(PROTECTED_PATHS.PROFILE)

    return { success: true, data }
  } catch (error) {
    console.error('Server action error:', error)

    return {
      success: false,
      error: 'サーバーエラーが発生しました',
    }
  }
}
