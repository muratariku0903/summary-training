import { NextRequest, NextResponse } from 'next/server'
import { JSX } from 'react'
import { SENDING_PATTERN, SENDING_PATTERN_TYPE } from '../constants/email'
import PasswordChangeNotification from '@/components/emails/PasswordChangeNotification'
import { render } from '@react-email/render'
import AccountDeletionNotification from '@/components/emails/styles/AccountDeleteNotification'
import { cookies } from 'next/headers'
import z, { ZodRawShape } from 'zod'
import { Result } from '@/types/common'

export const getAccessTokenFromHeader = (req: NextRequest): string | null => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Not found Bearer token')
    return null
  }

  return authHeader.replace('Bearer ', '')
}

export const requestParse = async <T extends ZodRawShape>(
  req: Request,
  schema: z.ZodObject<T>,
): Promise<Result<z.infer<z.ZodObject<T>>>> => {
  try {
    const body = await req.json()

    const {
      success: parseSuccess,
      data: parseData,
      error: parseError,
    } = schema.safeParse(body)
    if (!parseSuccess) {
      return { success: false, error: Error(String(parseError)) }
    }

    return { success: true, data: parseData }
  } catch (e) {
    console.error('requestParse Error', e)
    return { success: false, error: Error(String(e)) }
  }
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

export const deleteTokenFromCookie = async (
  response: NextResponse,
): Promise<NextResponse> => {
  // クッキーに保存されてるセッション情報を破棄
  const prefix = `sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token`
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  allCookies
    .filter((c) => c.name.startsWith(prefix))
    .forEach((c) => {
      response.cookies.delete(c.name)
    })

  return response
}
