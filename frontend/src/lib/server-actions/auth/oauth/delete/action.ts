'use server'

import { createServerComponentClient } from '../../../../supabase/client/serverComponentClient'
import { DeleteOAuthSchema } from './schema'
import { withServerAction } from '@/lib/server-actions/wrapper'

// OAuth接続解除のサーバーアクション（認証必須）
export const deleteOAuthAction = withServerAction<DeleteOAuthSchema, undefined>(
  async (input, _, logger) => {
    const serverComponentClient = await createServerComponentClient()

    logger.info('Deleting OAuth connection', {
      provider: input.provider,
    })

    // ユーザーの連携情報を取得
    const { data: identities, error: idError } =
      await serverComponentClient.auth.getUserIdentities()
    if (idError) {
      logger.error('Failed to get user identities', idError)
      return {
        success: false,
        error: '連携情報の取得に失敗しました',
      }
    }

    // 指定されたプロバイダーの連携を検索
    const { provider } = input
    const targetId = identities.identities.find((i) => i.provider === provider)
    if (!targetId) {
      logger.warn('OAuth provider not found', { provider })
      return {
        success: false,
        error: `${provider}との連携が見つかりませんでした`,
      }
    }

    // OAuth連携を解除
    const { error: unlinkError } =
      await serverComponentClient.auth.unlinkIdentity(targetId)
    if (unlinkError) {
      logger.error('Failed to unlink OAuth identity', unlinkError, { provider })
      return {
        success: false,
        error: unlinkError.message,
      }
    }

    logger.info('OAuth connection deleted successfully', {
      provider,
      identityId: targetId.id,
    })

    return { success: true, data: undefined }
  },
  { actionName: 'deleteOAuth', requireAuth: true },
)
