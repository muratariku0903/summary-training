import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/client/adminClient'
import { Success, InternalError, Unauthorized } from '@/lib/api/response'
import { getAccessTokenFromHeader } from '@/lib/api/utils'
import { cookies } from 'next/headers'
import { getDescopeUserIdByAuthUserId } from '@/lib/supabase/auth/admin'
import { deleteDescopeUser } from '@/lib/descope/utils'

export const DELETE = async (req: NextRequest): Promise<NextResponse> => {
  try {
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

    // Descopeプロバイダでログイン（Passkey登録）してるユーザーであれば、そちらも削除
    // 「idp_links」はCASCADE設定により、auth.usersを削除すると自動的に削除される
    const {
      success: getDescopeUserSuccess,
      descopeUserId,
      message: getDescopeUserError,
    } = await getDescopeUserIdByAuthUserId(user.id)
    if (getDescopeUserError) {
      console.error(getDescopeUserError)
      // TODO DESCOPEユーザー削除に失敗した際の動作
    }

    if (getDescopeUserSuccess && descopeUserId) {
      const { data: u } = await adminClient.auth.admin.getUserById(user.id)
      const descopeLoginId = u.user?.app_metadata.descope_login_id as string | undefined
      if (descopeLoginId) {
        const { error: descopeDeleteError } = await deleteDescopeUser(
          descopeLoginId,
          descopeUserId,
        )
        if (descopeDeleteError) {
          console.error(descopeDeleteError)
          // TODO DESCOPEユーザー削除に失敗した際の動作
        }
      }
    }

    // メインのユーザーアカウント削除
    // CASCADE設定により、user_profilesの手動削除は不要
    // auth.usersを削除すると自動的にuser_profilesも削除される
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error('❌ [DELETE-USER] User deletion failed:', deleteError.message)
      return InternalError(
        'Failed to delete user account',
        deleteError.message,
      ).toResponse()
    }

    const res = Success({
      message: 'User account has been successfully deleted',
      deletedUserId: user.id,
    }).toResponse()

    // クッキーに保存されてるセッション情報を破棄
    const prefix = `sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token`
    console.log('prefix:', prefix)
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
