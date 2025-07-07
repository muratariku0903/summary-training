'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { UserProfile, UserProfileUpdate } from '../supabase/schema/utils'
import { PROTECTED_PATHS, PUBLIC_PATHS } from '../constants/routes'
import { createClient } from '../supabase/client/serverComponentClient'
import { z } from 'zod'
import { ActionResult } from './types'
import { validateFormData } from './utils'

// バリデーションスキーマ
const updateProfileSchema = z.object({
  user_name: z
    .string()
    .min(1, 'ユーザー名は必須です')
    .max(50, 'ユーザー名は50文字以内で入力してください'),
  display_name: z
    .string()
    .min(1, '表示名は必須です')
    .max(100, '表示名は100文字以内で入力してください'),
  bio: z.string().max(500, '自己紹介は500文字以内で入力してください').optional(),
})

// プロフィール更新のサーバーアクション
export const updateProfile = async (
  formData: FormData
): Promise<ActionResult<UserProfile>> => {
  try {
    const serverComponentClient = await createClient()

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await serverComponentClient.auth.getUser()
    if (authError || !user) {
      console.error(authError)
      redirect(PUBLIC_PATHS.SIGNIN)
    }

    // フォームデータを解析&バリデーション
    const {
      success,
      data: validatedFormData,
      error: validateError,
    } = validateFormData(formData, updateProfileSchema)
    if (!success) {
      console.error(validateError)
      return {
        success: false,
        error: validateError,
      }
    }

    // データベースを更新
    const updateData: UserProfileUpdate = {
      user_name: validatedFormData.user_name,
      display_name: validatedFormData.display_name,
      bio: validatedFormData.bio || null,
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
