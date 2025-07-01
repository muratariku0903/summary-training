// src/lib/supabase/auth/auth.ts - 修正版
import { browserClient } from '../browserClient'
import { getAvailableMfaFactors } from './mfa'
import {
  signinSchema,
  signupSchema,
  type SigninInput,
  type SignupInput,
  SigninResponse,
  SignupResponse,
  SignoutResponse,
} from './types'
import { AUTH_MESSAGES, AUTH_LOG_MESSAGES } from '@/lib/constants/auth'
import { ZodError } from 'zod'

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

    const { data, error } = await browserClient.auth.signUp({
      email: validatedInput.email,
      password: validatedInput.password,
      options: {
        data: {
          userName: validatedInput.userName,
        },
        emailRedirectTo: `${baseUrl}/callback`,
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
    console.log(AUTH_LOG_MESSAGES.SIGNOUT_ATTEMPT)

    const { error } = await browserClient.auth.signOut()

    if (error) {
      console.error(AUTH_LOG_MESSAGES.SIGNOUT_ERROR, error.message)
      return {
        success: false,
        message: AUTH_MESSAGES.SIGNOUT_FAILED,
      }
    }

    console.log(AUTH_LOG_MESSAGES.SIGNOUT_SUCCESS)

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
