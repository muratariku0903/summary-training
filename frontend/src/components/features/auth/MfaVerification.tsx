'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthCodeInput, {
  AUTH_CODE_VALIDATIONS,
  INPUT_FORMATTERS,
} from '@/components/elements/auth-code/AuthCode'
import ReversalButton from '@/components/elements/reversal-button/ReversalButton'
import { MfaFactor } from '@/lib/supabase/auth/types'
import { verifyTotp } from '@/lib/supabase/auth/mfa'
import { PROTECTED_PATHS } from '@/lib/constants/routes'
import { MFA_TYPES } from '@/lib/constants/auth'

interface MfaVerificationProps {
  selectedMFA: Omit<MfaFactor, 'status' | 'createdAt'>
  onBack?: () => void
}

export default function MfaVerification({ selectedMFA, onBack }: MfaVerificationProps) {
  const router = useRouter()
  const [mfaError, setMfaError] = useState<string | null>(null)

  // MFA認証画面の表示
  const renderMfaContent = () => {
    switch (selectedMFA.type) {
      case MFA_TYPES.TOTP:
        return renderTotpVerification()
      default:
        return renderUnsupportedMfa()
    }
  }

  // TOTP認証画面
  const renderTotpVerification = () => (
    <div className='w-full max-w-sm space-y-4 bg-white p-6 border-2 border-black'>
      <h1 className='text-center text-2xl font-semibold'>TOTP認証</h1>

      {selectedMFA.friendlyName && (
        <p className='text-center text-sm font-medium text-gray-700'>
          デバイス: {selectedMFA.friendlyName}
        </p>
      )}

      <AuthCodeInput
        onSubmit={handleTotpVerification}
        submitLabel='認証'
        submittingLabel='認証中...'
        showBackButton={true}
        onBack={onBack}
        backLabel='戻る'
        errorMessage={mfaError}
        description='認証アプリに表示される6桁のコードを入力してください'
        placeholder='123456'
        inputLabel='認証コード'
        validation={AUTH_CODE_VALIDATIONS.TOTP_6_DIGITS}
        formatInput={INPUT_FORMATTERS.DIGITS_ONLY}
      />

      <div className='text-xs text-gray-500 text-center space-y-1'>
        <p>対応アプリ:</p>
        <p>• Google Authenticator</p>
        <p>• Microsoft Authenticator</p>
        <p>• Authy など</p>
      </div>
    </div>
  )

  // TOTP認証処理
  const handleTotpVerification = async (code: string) => {
    setMfaError(null)

    try {
      const result = await verifyTotp({
        factorId: selectedMFA.id,
        totpCode: code,
      })

      if (!result.success) {
        setMfaError(result.message || 'TOTP認証に失敗しました')
        return
      }

      router.replace(PROTECTED_PATHS.DASHBOARD)
    } catch (e) {
      console.error(e)
      setMfaError('認証処理中にエラーが発生しました')
    }
  }

  // 未対応の認証方法画面
  const renderUnsupportedMfa = () => (
    <div className='w-full max-w-sm space-y-4 bg-white p-6 border-2 border-black'>
      <h1 className='text-center text-2xl font-semibold'>{selectedMFA.type} 認証</h1>

      <p className='text-center text-sm text-gray-600'>
        この認証方法はまだサポートされていません
      </p>

      <ReversalButton label='戻る' className='w-full' onClick={onBack} />
    </div>
  )

  return (
    <>
      <div className='flex justify-center py-4'>{renderMfaContent()}</div>
    </>
  )
}
