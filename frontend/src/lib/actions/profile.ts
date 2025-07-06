'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Tables } from '../supabase/schema/schema'
import { UserProfile } from '../supabase/schema/utils'

// バリデーションスキーマ
const updateProfileSchema = z.object({
  username: z
    .string()
    .min(1, 'ユーザー名は必須です')
    .max(50, 'ユーザー名は50文字以内で入力してください'),
  display_name: z
    .string()
    .min(1, '表示名は必須です')
    .max(100, '表示名は100文字以内で入力してください'),
  bio: z.string().max(500, '自己紹介は500文字以内で入力してください').optional(),
})

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// プロフィール更新のサーバーアクション
export async function updateProfile(
  formData: FormData
): Promise<ActionResult<UserProfile>> {
  try {
    const supabase = createServerActionClient({ cookies })

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect('/login')
    }

    // フォームデータを解析
    const rawData = {
      username: formData.get('username') as string,
      display_name: formData.get('display_name') as string,
      bio: (formData.get('bio') as string) || '',
    }

    // バリデーション
    const result = updateProfileSchema.safeParse(rawData)

    if (!result.success) {
      return {
        success: false,
        error: result.error.issues[0].message,
      }
    }

    // データベースを更新
    const { data, error } = await supabase
      .from('profiles')
      .update({
        username: result.data.username,
        display_name: result.data.display_name,
        bio: result.data.bio,
        updated_at: new Date().toISOString(),
      })
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
    revalidatePath('/profile')

    return {
      success: true,
      data: {
        id: data.id,
        username: data.username,
        display_name: data.display_name,
        email: user.email || '',
        bio: data.bio,
        created_at: data.created_at,
        updated_at: data.updated_at,
        avatar_url: data.avatar_url,
        two_factor_enabled: data.two_factor_enabled || false,
      },
    }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: 'サーバーエラーが発生しました',
    }
  }
}
