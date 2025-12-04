import { getRequestLogger } from '../../log/storage'

const DESCOPE_PROJECT_ID = process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID
const DESCOPE_MGMT_KEY = process.env.DESCOPE_MGMT_KEY

export const deleteDescopeUser = async (
  loginId: string,
  userId: string,
): Promise<{ success: true; error?: never } | { success: false; error: string }> => {
  // パスキー資格情報の削除
  const { success: deletePasskeySuccess, error: deletePasskeyError } = await post(
    'https://api.descope.com/v1/mgmt/user/passkeys/delete',
    { loginId },
  )
  if (!deletePasskeySuccess) {
    return {
      success: false,
      error: deletePasskeyError,
    }
  }

  // Descope ユーザー削除
  const { success: deleteUserSuccess, error: deleteUserError } = await post(
    'https://api.descope.com/v1/mgmt/user/delete',
    { loginId, userId },
  )
  if (!deleteUserSuccess) {
    return {
      success: false,
      error: deleteUserError,
    }
  }

  return {
    success: true,
  }
}

export const updateDescopeUserEmail = async (
  loginId: string,
  email: string,
): Promise<{ success: true; error?: never } | { success: false; error: string }> => {
  // パスキー資格情報の削除
  const { success, error } = await post(
    'https://api.descope.com/v1/mgmt/user/update/email',
    { loginId, email, verified: true },
  )
  if (!success) {
    return {
      success: false,
      error: error,
    }
  }

  return {
    success: true,
  }
}

const post = async <T = unknown>(
  path: string,
  body: object,
): Promise<
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string }
> => {
  const logger = getRequestLogger()

  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${DESCOPE_PROJECT_ID}:${DESCOPE_MGMT_KEY}` },
      body: JSON.stringify(body),
    })

    return { success: true, data: await res.json() }
  } catch (e: unknown) {
    logger.error('Failed descope request', e, { method: 'POST', path })
    return { success: false, error: `fail ${path}` }
  }
}
