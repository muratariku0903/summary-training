// src/lib/supabase/auth/auth.ts - 修正版
import { PROTECTED_PATHS, PUBLIC_PATHS } from '@/lib/constants/routes'
import { browserClient } from '../client/browserClient'
import { getAvailableMfaFactors } from './mfa'
import {
  signinSchema,
  signupSchema,
  type SigninInput,
  type SignupInput,
  SigninResponse,
  SignupResponse,
  SignoutResponse,
  ChangePasswordResponse,
  ChangePasswordInput,
  ChangeEmailInput,
  ChangeEmailResponse,
  ResetPasswordInput,
  ResetPasswordResponse,
} from './types'
import { AUTH_MESSAGES, AUTH_LOG_MESSAGES } from '@/lib/constants/auth'
import { ZodError } from 'zod'
import { User } from '@supabase/supabase-js'

/**
 * サインイン処理
 */
export async function signIn(input: SigninInput): Promise<SigninResponse> {
  try {
    // バリデーション
    const validatedInput = signinSchema.parse(input)

    console.log(AUTH_LOG_MESSAGES.SIGNIN_ATTEMPT, validatedInput.email)

    // 基本認証
    const { data: authData, error: authError } =
      await browserClient.auth.signInWithPassword({
        email: validatedInput.email,
        password: validatedInput.password,
      })
    if (authError) {
      console.error(AUTH_LOG_MESSAGES.SIGNIN_ERROR, authError.message)
      return {
        success: false,
        message: authError.message,
      }
    }
    if (!authData.user) {
      return {
        success: false,
        message: AUTH_MESSAGES.AUTH_FAILED,
      }
    }

    console.log(AUTH_LOG_MESSAGES.SIGNIN_SUCCESS, authData.user.id)

    // 利用可能なMFA設定を確認
    const { success, factors } = await getAvailableMfaFactors()
    if (!success) {
      console.warn('⚠️ [SIGNIN] Could not check MFA factors, proceeding without MFA')
      // MFA確認に失敗した場合は通常ログインとして処理
      return {
        success: true,
        message: AUTH_MESSAGES.SIGNIN_SUCCESS,
        requiresMfa: false,
      }
    }

    // MFA未設定の場合は通常ログイン完了
    if (!factors || factors.length === 0) {
      console.log('✅ [SIGNIN] Login successful without MFA')
      return {
        success: true,
        message: AUTH_MESSAGES.SIGNIN_SUCCESS,
        requiresMfa: false,
      }
    }

    console.log(`🔐 [SIGNIN] MFA required with ${factors.length} available factors`)

    return {
      success: true,
      message: AUTH_MESSAGES.SIGNIN_MFA_REQUIRED,
      requiresMfa: true,
      mfaFactors: factors,
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        message: error.errors[0]?.message || AUTH_MESSAGES.VALIDATION_ERROR,
      }
    }

    console.error(AUTH_LOG_MESSAGES.UNEXPECTED_SIGNIN_ERROR, error)
    return {
      success: false,
      message: AUTH_MESSAGES.UNEXPECTED_ERROR,
    }
  }
}

/**
 * サインアップ処理
 */
export async function signUp(input: SignupInput): Promise<SignupResponse> {
  try {
    // バリデーション
    const validatedInput = signupSchema.parse(input)

    console.log(AUTH_LOG_MESSAGES.SIGNUP_ATTEMPT, validatedInput.email)

    const baseUrl = window.location.origin

    console.log(`emailRedirectTo: ${baseUrl}${PUBLIC_PATHS.CALLBACK}`)

    const { data, error } = await browserClient.auth.signUp({
      email: validatedInput.email,
      password: validatedInput.password,
      options: {
        data: {
          userName: validatedInput.userName,
        },
        // supabase側でリダイレクトの許可URL追加するのを忘れずに
        emailRedirectTo: `${baseUrl}${PUBLIC_PATHS.CALLBACK}`,
      },
    })
    if (error) {
      console.error(AUTH_LOG_MESSAGES.SIGNUP_ERROR, error.message)
      return {
        success: false,
        message: error.message,
      }
    }
    if (!data.user) {
      return {
        success: false,
        message: AUTH_MESSAGES.SIGNUP_FAILED,
      }
    }

    console.log(AUTH_LOG_MESSAGES.SIGNUP_SUCCESS)

    return {
      success: true,
      message: AUTH_MESSAGES.SIGNUP_SUCCESS,
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        message: error.errors[0]?.message || AUTH_MESSAGES.VALIDATION_ERROR,
      }
    }

    console.error(AUTH_LOG_MESSAGES.UNEXPECTED_SIGNUP_ERROR, error)
    return {
      success: false,
      message: AUTH_MESSAGES.UNEXPECTED_ERROR,
    }
  }
}

/**
 * サインアウト処理
 */
export async function signOut(): Promise<SignoutResponse> {
  try {
    const { error } = await browserClient.auth.signOut()

    if (error) {
      console.error(AUTH_LOG_MESSAGES.SIGNOUT_ERROR, error.message)
      return {
        success: false,
        message: AUTH_MESSAGES.SIGNOUT_FAILED,
      }
    }

    return {
      success: true,
      message: AUTH_MESSAGES.SIGNOUT_SUCCESS,
    }
  } catch (error) {
    console.error(AUTH_LOG_MESSAGES.UNEXPECTED_SIGNOUT_ERROR, error)
    return {
      success: false,
      message: AUTH_MESSAGES.UNEXPECTED_ERROR,
    }
  }
}

/**
 * パスワード変更処理
 */
export async function changePassword(
  input: ChangePasswordInput,
): Promise<ChangePasswordResponse> {
  const { newPassword } = input

  try {
    const { data: userData, error: getUserError } = await browserClient.auth.getUser()
    if (getUserError) {
      console.error(AUTH_LOG_MESSAGES.CHANGE_PASSWORD_ERROR, getUserError.message)
      return {
        success: false,
        message: AUTH_MESSAGES.CHANGE_PASSWORD_FAILED,
      }
    }
    if (!userData.user.email) {
      return {
        success: false,
        message: AUTH_MESSAGES.CHANGE_PASSWORD_FAILED,
      }
    }

    // メール認証がプリイマリとなってるかチェック
    // GoogleやPasskeyがプライマリとして設定されている場合（GoogleやPasskeyのみの認証ユーザー）、パスワード変更不可能
    const emailPrimaryProvider = isEmailPrimaryProvider(userData.user.app_metadata)
    if (!emailPrimaryProvider) {
      console.error('password not set up')
      return {
        success: false,
        message: 'password not set up',
      }
    }

    // パスワード変更
    // MFA設定をしてる場合は、AAL2のセッション情報が必要
    const { error: updError } = await browserClient.auth.updateUser({
      password: newPassword,
    })
    if (updError) {
      console.error(AUTH_LOG_MESSAGES.CHANGE_PASSWORD_ERROR, updError.message)
      return {
        success: false,
        message: AUTH_MESSAGES.CHANGE_PASSWORD_FAILED,
      }
    }

    return {
      success: true,
      message: AUTH_MESSAGES.CHANGE_PASSWORD_SUCCESS,
    }
  } catch (error) {
    console.error(AUTH_LOG_MESSAGES.UNEXPECTED_SIGNOUT_ERROR, error)
    return {
      success: false,
      message: AUTH_MESSAGES.UNEXPECTED_ERROR,
    }
  }
}

/**
 * メールアドレス変更処理
 */
export async function changeEmail(input: ChangeEmailInput): Promise<ChangeEmailResponse> {
  const { email } = input

  try {
    console.log(AUTH_LOG_MESSAGES.CHANGE_EMAIL_ATTEMPT)

    const { data: userData, error: getUserError } = await browserClient.auth.getUser()
    if (getUserError) {
      console.error(AUTH_LOG_MESSAGES.CHANGE_EMAIL_ERROR, getUserError.message)
      return {
        success: false,
        message: AUTH_MESSAGES.CHANGE_EMAIL_FAILED,
      }
    }
    if (!userData.user.email) {
      return {
        success: false,
        message: AUTH_MESSAGES.CHANGE_EMAIL_FAILED,
      }
    }

    // メールアドレス変更
    // ユーザーに確認メール送信
    // MFA設定をしてる場合は、AAL2のセッション情報が必要
    const baseUrl = window.location.origin
    const { error: updError } = await browserClient.auth.updateUser(
      { email: email },
      { emailRedirectTo: `${baseUrl}${PROTECTED_PATHS.EMAIL_CHANGE_CALLBACK}` },
    )
    if (updError) {
      console.error(AUTH_LOG_MESSAGES.CHANGE_PASSWORD_ERROR, updError.message)
      return {
        success: false,
        message: AUTH_MESSAGES.CHANGE_EMAIL_FAILED,
      }
    }

    return {
      success: true,
      message: AUTH_MESSAGES.CHANGE_EMAIL_SUCCESS,
    }
  } catch (error) {
    console.error(AUTH_LOG_MESSAGES.CHANGE_EMAIL_ERROR, error)
    return {
      success: false,
      message: AUTH_MESSAGES.CHANGE_EMAIL_FAILED,
    }
  }
}

/**
 * パスワードリセット処理
 */
export async function resetPassword(
  input: ResetPasswordInput,
): Promise<ResetPasswordResponse> {
  const { email } = input

  try {
    // メール送信
    const baseUrl = window.location.origin
    console.log(`emailRedirectTo: ${baseUrl}${PUBLIC_PATHS.PASSWORD_RESET_CALLBACK}`)
    const { error: resetError } = await browserClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}${PUBLIC_PATHS.PASSWORD_RESET_CALLBACK}`,
    })
    if (resetError) {
      console.error(AUTH_LOG_MESSAGES.RESET_PASSWORD_ERROR, resetError.message)
      return {
        success: false,
        message: AUTH_MESSAGES.RESET_PASSWORD_FAILED,
      }
    }

    return {
      success: true,
      message: AUTH_MESSAGES.RESET_PASSWORD_SUCCESS,
    }
  } catch (error) {
    console.error(AUTH_LOG_MESSAGES.RESET_PASSWORD_ERROR, error)
    return {
      success: false,
      message: AUTH_MESSAGES.RESET_PASSWORD_FAILED,
    }
  }
}

/**
 * 認証プロバイダでメインがEmailかどうかの判定
 * 一番最初の新規会員登録にてメールで認証した場合、Emailがメインプロバイダ扱いとなる
 */
export const isEmailPrimaryProvider = (metadata: User['app_metadata']) => {
  let res = metadata.provider === 'email'
  if (Object.hasOwn(metadata, 'email_primary_provider')) {
    res = metadata.email_primary_provider
  }

  return res
}
