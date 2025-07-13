// src/lib/supabase/auth/types.ts - 修正版
import { z } from 'zod'
import { MFA_TYPES, VALIDATION_MESSAGES } from '@/lib/constants/auth'
import { User } from '@supabase/supabase-js'

// バリデーションスキーマ（定数使用）
export const signinSchema = z.object({
  email: z
    .string({ required_error: VALIDATION_MESSAGES.EMAIL_REQUIRED })
    .email(VALIDATION_MESSAGES.EMAIL_INVALID),
  password: z
    .string({ required_error: VALIDATION_MESSAGES.PASSWORD_REQUIRED })
    .min(8, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH),
})
export type SigninInput = z.infer<typeof signinSchema>
export type SigninResponse =
  | {
      success: true
      message: string
      requiresMfa: false
      mfaFactors?: never
    }
  | {
      success: true
      message: string
      requiresMfa: true
      mfaFactors: MfaFactor[]
    }
  | {
      success: false
      message: string
      requiresMfa?: never
      mfaFactors?: never
    }

export const signupSchema = z
  .object({
    userName: z
      .string({ required_error: VALIDATION_MESSAGES.USERNAME_REQUIRED })
      .min(2, VALIDATION_MESSAGES.USERNAME_MIN_LENGTH),
    email: z
      .string({ required_error: VALIDATION_MESSAGES.EMAIL_REQUIRED })
      .email(VALIDATION_MESSAGES.EMAIL_INVALID),
    password: z
      .string({ required_error: VALIDATION_MESSAGES.PASSWORD_REQUIRED })
      .min(8, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH)
      .regex(/[A-Z]/, VALIDATION_MESSAGES.PASSWORD_UPPERCASE)
      .regex(/[a-z]/, VALIDATION_MESSAGES.PASSWORD_LOWERCASE)
      .regex(/[0-9]/, VALIDATION_MESSAGES.PASSWORD_NUMBER),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: VALIDATION_MESSAGES.PASSWORD_MISMATCH,
    path: ['confirmPassword'],
  })
export type SignupInput = z.infer<typeof signupSchema>
export type SignupResponse =
  | {
      success: true
      message: string
      emailConfirmationRequired?: boolean
    }
  | {
      success: false
      message: string
    }

// MFA関連のバリデーションスキーマ
export const totpVerificationSchema = z.object({
  challengeId: z
    .string({ required_error: 'チャレンジIDが必要です' })
    .min(1, 'チャレンジIDが無効です'),
  factorId: z
    .string({ required_error: 'ファクターIDが必要です' })
    .min(1, 'ファクターIDが無効です'),
  totpCode: z
    .string({ required_error: VALIDATION_MESSAGES.TOTP_CODE_REQUIRED })
    .length(6, VALIDATION_MESSAGES.TOTP_CODE_LENGTH)
    .regex(/^\d{6}$/, 'TOTPコードは6桁の数字で入力してください'),
})
export type TotpVerificationInput = z.infer<typeof totpVerificationSchema>
export type TotpVerificationResponse =
  | {
      success: true
      message: string
    }
  | {
      success: false
      message: string
    }

export const totpSetupSchema = z.object({
  totpCode: z
    .string({ required_error: VALIDATION_MESSAGES.TOTP_CODE_REQUIRED })
    .length(6, VALIDATION_MESSAGES.TOTP_CODE_LENGTH)
    .regex(/^\d{6}$/, 'TOTPコードは6桁の数字で入力してください'),
})
export type TotpSetupInput = z.infer<typeof totpSetupSchema>

export const totpSetupVerificationSchema = z.object({
  factorId: z
    .string({ required_error: 'ファクターIDが必要です' })
    .min(1, 'ファクターIDが無効です'),
  totpCode: z
    .string({ required_error: VALIDATION_MESSAGES.TOTP_CODE_REQUIRED })
    .length(6, VALIDATION_MESSAGES.TOTP_CODE_LENGTH)
    .regex(/^\d{6}$/, 'TOTPコードは6桁の数字で入力してください'),
})
export type TotpSetupVerificationInput = z.infer<typeof totpSetupVerificationSchema>

export type SignoutResponse =
  | {
      success: true
      message: string
    }
  | {
      success: false
      message: string
    }

export type AuthError = {
  success: false
  message: string
  code?: string
}

export type TotpEnrollmentResponse =
  | {
      success: true
      message: string
      qrCode: string // success: trueの場合は必須
      secret: string // success: trueの場合は必須
      factorId: string // success: trueの場合は必須
    }
  | {
      success: false
      message: string
      qrCode?: never // success: falseの場合は存在しない
      secret?: never // success: falseの場合は存在しない
      factorId?: never // success: falseの場合は存在しない
    }

export type TotpSetupResponse =
  | {
      success: true
      message: string
      verify_data: {
        access_token: string
        refresh_token: string
      }
    }
  | {
      success: false
      message: string
      verify_data?: never
    }

// MFA Factor情報
export type MfaType = (typeof MFA_TYPES)[keyof typeof MFA_TYPES]
export type MfaFactor = {
  id: string
  type: MfaType
  status: 'verified' | 'unverified'
  friendlyName?: string
  createdAt: string
  // 各MFA方式固有の情報
  metadata?: {
    // TOTP用
    qrCode?: string
    secret?: string
    // SMS用
    phoneNumber?: string
  }
}
export type GetAvailableMfaFactorsResponse = {
  success: boolean
  message: string
  factors?: MfaFactor[]
}

export type TotpResetResponse = {
  success: boolean
  message: string
}

export type ListMfaResponse =
  | {
      success: true
      data: User['factors']
      error?: never
    }
  | {
      success: false
      data?: never
      error: string
    }
