'use server'

import { redirect } from 'next/navigation'
import { PUBLIC_PATHS } from '../../../../constants/routes'
import { createClient } from '../../../../supabase/client/serverComponentClient'
import { ActionResult } from '../../../types'
import { DeleteOAuthSchema } from './schema'

// OAuth接続解除のサーバーアクション
export const deleteOAuthAction = async (
  request: DeleteOAuthSchema,
): Promise<ActionResult> => {
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

    const { data: identities, error: idError } =
      await serverComponentClient.auth.getUserIdentities()
    if (idError) {
      return {
        success: false,
        error: idError.message,
      }
    }

    const { provider } = request
    const targetId = identities.identities.find((i) => i.provider === provider)
    if (!targetId) {
      return {
        success: false,
        error: `${provider} is not found`,
      }
    }

    const { error: unlinkError } =
      await serverComponentClient.auth.unlinkIdentity(targetId)
    if (unlinkError) {
      return {
        success: false,
        error: unlinkError.message,
      }
    }

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Server action error:', error)

    return {
      success: false,
      error: 'サーバーエラーが発生しました',
    }
  }
}
