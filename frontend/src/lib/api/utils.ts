import { NextRequest } from 'next/server'
import { JSX } from 'react'
import { SENDING_PATTERN, SENDING_PATTERN_TYPE } from '../constants/email'
import PasswordChangeNotification from '@/components/emails/PasswordChangeNotification'
import { render } from '@react-email/render'
import AccountDeletionNotification from '@/components/emails/styles/AccountDeleteNotification'

export const getAccessTokenFromHeader = (req: NextRequest): string | null => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Not found Bearer token')
    return null
  }

  return authHeader.replace('Bearer ', '')
}

type CreateMailComponentParams = {
  pattern: SENDING_PATTERN_TYPE
  userName: string
  supportEmail: string
}
export const createMailHTML = async (params: CreateMailComponentParams) => {
  const { pattern, userName, supportEmail } = params

  try {
    let component: JSX.Element
    let subject: string

    switch (pattern) {
      case SENDING_PATTERN.PASSWORD_CHANGE_NOTIFICATION:
        component = PasswordChangeNotification({
          userName,
          supportEmail,
        })
        subject = '【株式会社サンプル】パスワード変更完了のお知らせ'
        break

      case SENDING_PATTERN.ACCOUNT_DELETE_NOTIFICATION:
        component = AccountDeletionNotification({
          userName,
          supportEmail,
        })
        subject = '【株式会社サンプル】アカウント退会処理完了のお知らせ'
        break

      default:
        throw Error('Unsupported sending pattern')
    }

    const html = await render(component)

    return { html, subject }
  } catch (e) {
    console.error('Fail rendering email html', e)
    throw e
  }
}
