'use server'

import { revalidatePath } from 'next/cache'
import { UserProfile, UserProfileUpdate } from '../../../../supabase/schema/utils'
import { PROTECTED_PATHS } from '../../../../constants/routes'
import { createServerComponentClient } from '../../../../supabase/client/serverComponentClient'
import { UpdateProfileSchema } from './schema'
import { withServerAction } from '@/lib/server-actions/wrapper'

// プロフィール更新のサーバーアクション
export const updateProfileAction = withServerAction<UpdateProfileSchema, UserProfile>(
  async (input, user, logger) => {
    const serverComponentClient = await createServerComponentClient()

    // データベースを更新
    logger.info('Updating profile', {
      userName: input.user_name,
      displayName: input.display_name,
    })
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
      logger.error('Profile update error', error)
      return {
        success: false,
        error: 'プロフィールの更新に失敗しました',
      }
    }

    // キャッシュを更新
    revalidatePath(PROTECTED_PATHS.PROFILE)
    logger.info('Profile updated successfully', { profileId: data.id })

    return { success: true, data }
  },
  { actionName: 'updateProfile', requireAuth: true },
)
