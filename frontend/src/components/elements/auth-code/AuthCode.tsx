'use client'

import { useState, FormEvent } from 'react'
import TextInput from '@/components/elements/text-input/TextInput'
import ReversalButton from '@/components/elements/reversal-button/ReversalButton'
import { Spacer } from '@/components/elements/spacer/Spacer'
import {
  MessageType,
  OutlineMessage,
} from '@/components/elements/outline-message/OutlineMessage'

type AuthCodeValidation = {
  /** 最小文字数 */
  minLength?: number
  /** 最大文字数 */
  maxLength?: number
  /** カスタムバリデーション関数 */
  validate?: (code: string) => boolean
  /** バリデーションエラーメッセージ */
  validationMessage?: string
}

type AuthCodeInputProps = {
  /** フォーム送信時のコールバック */
  onSubmit: (code: string) => Promise<void>
  /** 送信ボタンのラベル */
  submitLabel?: string
  /** ローディング中の送信ボタンラベル */
  submittingLabel?: string
  /** 戻るボタンを表示するか */
  showBackButton?: boolean
  /** 戻るボタンクリック時のコールバック */
  onBack?: () => void
  /** 戻るボタンのラベル */
  backLabel?: string
  /** エラーメッセージ */
  errorMessage?: string | null
  /** 説明文 */
  description?: string
  /** 無効化状態 */
  disabled?: boolean
  /** プレースホルダー */
  placeholder?: string
  /** 入力フィールドのラベル */
  inputLabel?: string
  /** バリデーション設定 */
  validation?: AuthCodeValidation
  /** 入力値の変換関数（デフォルト: 数字のみ） */
  formatInput?: (value: string) => string
}

export default function AuthCodeInput({
  onSubmit,
  submitLabel = '送信',
  submittingLabel = '送信中...',
  showBackButton = false,
  onBack,
  backLabel = '戻る',
  errorMessage,
  description = '認証コードを入力してください',
  disabled = false,
  placeholder = '123456',
  inputLabel = '認証コード',
  validation = { minLength: 6, maxLength: 6 },
  formatInput = (value: string) => value.replace(/\D/g, ''), // デフォルト: 数字のみ
}: AuthCodeInputProps) {
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // バリデーション関数
  const isValidCode = (inputCode: string): boolean => {
    // 最小文字数チェック
    if (validation.minLength && inputCode.length < validation.minLength) {
      return false
    }

    // 最大文字数チェック
    if (validation.maxLength && inputCode.length > validation.maxLength) {
      return false
    }

    // カスタムバリデーション
    if (validation.validate && !validation.validate(inputCode)) {
      return false
    }

    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isSubmitting || disabled || !isValidCode(code)) return

    setIsSubmitting(true)
    try {
      await onSubmit(code)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let formattedValue = formatInput(e.target.value)

    // 最大文字数制限
    if (validation.maxLength) {
      formattedValue = formattedValue.slice(0, validation.maxLength)
    }

    setCode(formattedValue)
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {description && <p className='text-center text-sm text-gray-600'>{description}</p>}

      <TextInput
        labelText={inputLabel}
        value={code}
        onChange={handleCodeChange}
        placeholder={placeholder}
        maxLength={validation.maxLength}
        className='text-center text-lg tracking-widest'
        disabled={disabled || isSubmitting}
      />

      <Spacer size={4} />

      {errorMessage && <OutlineMessage message={errorMessage} type={MessageType.ERROR} />}

      <div className='space-y-2'>
        <ReversalButton
          label={isSubmitting ? submittingLabel : submitLabel}
          className='w-full'
          border
          disable={isSubmitting || !isValidCode(code) || disabled}
        />

        {showBackButton && onBack && (
          <ReversalButton
            label={backLabel}
            className='w-full'
            onClick={onBack}
            disable={isSubmitting || disabled}
          />
        )}
      </div>
    </form>
  )
}

// 便利な事前定義済みバリデーション設定
export const AUTH_CODE_VALIDATIONS = {
  // 6桁のTOTPコード
  TOTP_6_DIGITS: {
    minLength: 6,
    maxLength: 6,
    validate: (code: string) => /^\d{6}$/.test(code),
    validationMessage: '6桁の数字を入力してください',
  },
  // 4桁のPINコード
  PIN_4_DIGITS: {
    minLength: 4,
    maxLength: 4,
    validate: (code: string) => /^\d{4}$/.test(code),
    validationMessage: '4桁の数字を入力してください',
  },
  // 8桁のバックアップコード
  BACKUP_8_DIGITS: {
    minLength: 8,
    maxLength: 8,
    validate: (code: string) => /^\d{8}$/.test(code),
    validationMessage: '8桁の数字を入力してください',
  },
  // 英数字混合（6-12文字）
  ALPHANUMERIC: {
    minLength: 6,
    maxLength: 12,
    validate: (code: string) => /^[A-Za-z0-9]+$/.test(code),
    validationMessage: '6-12文字の英数字を入力してください',
  },
} as const

// 便利な入力フォーマット関数
export const INPUT_FORMATTERS = {
  // 数字のみ
  DIGITS_ONLY: (value: string) => value.replace(/\D/g, ''),
  // 英数字のみ
  ALPHANUMERIC_ONLY: (value: string) => value.replace(/[^A-Za-z0-9]/g, ''),
  // 大文字に変換 + 英数字のみ
  UPPERCASE_ALPHANUMERIC: (value: string) =>
    value.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
  // そのまま（フィルタリングなし）
  NO_FILTER: (value: string) => value,
} as const
