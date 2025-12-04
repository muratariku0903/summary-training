import { NextRequest } from 'next/server'
import { adminClient } from '@/lib/supabase/client/adminClient'
import { Success, InternalError, Unauthorized } from '@/lib/api/response'
import { deleteTokenFromCookie } from '@/lib/api/utils'
import { getDescopeUserIdByAuthUserId } from '@/lib/supabase/auth/admin'
import { deleteDescopeUser } from '@/lib/descope/server/utils'
import { checkValidSessionLevel } from '@/lib/supabase/auth/server'
import { withAuth, withLogger } from '@/lib/api/wrapper'
import { LOG_MESSAGES } from '@/lib/log/message'

export const DELETE = withLogger(
  withAuth(async (_: NextRequest, user, { logger }) => {
    logger.info(LOG_MESSAGES.PROCESSING.USER_DELETE_STARTED)

    try {
      // セッションレベルチェック
      const { valid } = await checkValidSessionLevel(user)
      if (!valid) {
        logger.warn(LOG_MESSAGES.AUTH.INVALID_SESSION_LEVEL)
        return Unauthorized({ msg: LOG_MESSAGES.AUTH.INVALID_SESSION_LEVEL }).toResponse()
      }

      // Descopeプロバイダでログイン（Passkey登録）してるユーザーであれば、そちらも削除
      // 「idp_links」はCASCADE設定により、auth.usersを削除すると自動的に削除される
      const {
        success: getDescopeUserSuccess,
        descopeUserId,
        message: getDescopeUserError,
      } = await getDescopeUserIdByAuthUserId(user.id)
      if (getDescopeUserError) {
        logger.warn(LOG_MESSAGES.RESOURCE.DESCOPE_USER_ID_FETCH_FAILED, {
          errorMessage: getDescopeUserError,
        })
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
            logger.warn(LOG_MESSAGES.PROCESSING.DESCOPE_USER_DELETE_FAILED, {
              descopeUserId,
              descopeLoginId,
              errorMessage: descopeDeleteError,
            })
            // TODO DESCOPEユーザー削除に失敗した際の動作
          } else {
            logger.info(LOG_MESSAGES.PROCESSING.DESCOPE_USER_DELETE_COMPLETED, {
              descopeUserId,
              descopeLoginId,
            })
          }
        }
      }

      // メインのユーザーアカウント削除
      // CASCADE設定により、user_profilesの手動削除は不要
      // auth.usersを削除すると自動的にuser_profilesも削除される
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
      if (deleteError) {
        const msg = LOG_MESSAGES.PROCESSING.USER_DELETE_FAILED
        logger.error(msg, deleteError)
        return InternalError({
          msg,
          details: deleteError.message,
        }).toResponse()
      }

      const res = Success({
        message: LOG_MESSAGES.PROCESSING.USER_DELETE_COMPLETED,
        deletedUserId: user.id,
      }).toResponse()

      // クッキーに保存されてるセッション情報を破棄
      const deletedRes = await deleteTokenFromCookie(res)

      logger.info(LOG_MESSAGES.PROCESSING.USER_DELETE_COMPLETED, {
        deletedUserId: user.id,
      })

      return deletedRes
    } catch (error) {
      const msg = LOG_MESSAGES.PROCESSING.UNEXPECTED_ERROR
      logger.error(msg, error)
      return InternalError({
        msg,
      }).toResponse()
    }
  }),
)
