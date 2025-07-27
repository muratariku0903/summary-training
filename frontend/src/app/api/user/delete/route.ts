import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/client/adminClient'
import { Success, InternalError, Unauthorized } from '@/lib/api/response'
import { getAccessTokenFromHeader } from '@/lib/api/utils'
import { cookies } from 'next/headers'

export const DELETE = async (req: NextRequest): Promise<NextResponse> => {
  try {
    console.log('🗑️ [DELETE-USER] Starting user deletion process')

    // 認証ヘッダーからアクセストークンを取得
    const accessToken = getAccessTokenFromHeader(req)
    if (!accessToken) {
      console.error('❌ [DELETE-USER] No valid authorization header')
      return Unauthorized('Authorization header required').toResponse()
    }

    // アクセストークンからユーザー情報を取得
    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(accessToken)

    if (userError || !user) {
      console.error('❌ [DELETE-USER] Invalid access token:', userError?.message)
      return Unauthorized('Invalid access token').toResponse()
    }

    console.log('✅ [DELETE-USER] User authenticated:', user.id)

    // CASCADE設定により、user_profilesの手動削除は不要
    // auth.usersを削除すると自動的にuser_profilesも削除される

    // メインのユーザーアカウント削除
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error('❌ [DELETE-USER] User deletion failed:', deleteError.message)
      return InternalError(
        'Failed to delete user account',
        deleteError.message,
      ).toResponse()
    }

    console.log('✅ [DELETE-USER] User account successfully deleted:', user.id)

    const res = Success({
      message: 'User account has been successfully deleted',
      deletedUserId: user.id,
    }).toResponse()

    // クッキーに保存されてるセッション情報を破棄
    const prefix = `sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token`
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    allCookies
      .filter((c) => c.name.startsWith(prefix))
      .forEach((c) => {
        res.cookies.delete(c.name)
      })

    return res
  } catch (error) {
    console.error('❌ [DELETE-USER] Unexpected error:', error)
    return InternalError('Internal server error during user deletion').toResponse()
  }
}
