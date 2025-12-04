'use client'

import { User } from '@supabase/supabase-js'
import { MfaType } from '@/lib/supabase/auth/types'
import TwoFactorAuthenticationMethodList from './TwoFactorAuthenticationMethodList'
import { MFA_TYPES } from '@/lib/supabase/auth/types'
import { useState } from 'react'
import ConfirmDialog from '@/components/elements/confirm-dialog/ConfirmDialog'
import TotpSetup from '@/components/features/auth/TotpSetup'
import { enrollTotpFactor, listMfa, resetEnrollment } from '@/lib/supabase/auth/mfa'
import ReversalButton from '@/components/elements/reversal-button/ReversalButton'
import { useRouter } from 'next/navigation'
import { PROTECTED_PATHS } from '@/lib/constants/routes'
import { useSnackbarStore } from '@/stores/useSnackbarStore'
import { UI_MESSAGES } from '@/lib/constants/ui'
import { clientLogger } from '@/stores/useClientLoggerStore'

type TwoFactorAuthenticationSettingProps = {
  factors: User['factors']
}

export default function TwoFactorAuthenticationSetting({
  factors,
}: TwoFactorAuthenticationSettingProps) {
  const router = useRouter()

  const [settingMode, setSettingMode] = useState<SettingMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mfaData, setMfaData] = useState<MfaData | null>(null)
  const [state, setState] = useState(factors)
  const showSnackbar = useSnackbarStore((s) => s.show)

  const methodItems = [
    {
      type: MFA_TYPES.TOTP,
      name: 'TOTP認証',
      desc: '認証アプリを使用した時間ベースのワンタイムパスワード',
      enable: isMethodEnabled(state, MFA_TYPES.TOTP),
      onClickUpdate: async () => {
        const { success, factorId, qrCode, message } = await enrollTotpFactor()
        if (!success) {
          setError(message)

          return
        }

        setMfaData({ type: MFA_TYPES.TOTP, data: { factorId, qrCode } })
        setSettingMode({ type: MFA_TYPES.TOTP, mode: 'update' })
      },
      onClickReset: () => setSettingMode({ type: MFA_TYPES.TOTP, mode: 'delete' }),
    },
    {
      type: MFA_TYPES.SMS,
      name: 'SMS認証',
      desc: 'SMS経由でのワンタイムパスワード',
      enable: isMethodEnabled(state, MFA_TYPES.SMS),
      onClickUpdate: () => clientLogger.info('SMS authentication update clicked'),
      onClickReset: () => clientLogger.info('SMS authentication reset clicked'),
    },
  ]

  if (
    settingMode &&
    settingMode.type === MFA_TYPES.TOTP &&
    settingMode.mode === 'delete'
  ) {
    // TOTP無効にする場合
    return (
      <>
        <TwoFactorAuthenticationMethodList items={methodItems} />
        <ConfirmDialog
          isOpen={true}
          onClose={() => setSettingMode(null)}
          onConfirm={async () => {
            clientLogger.info('start reset enroll')
            const { success, message } = await resetEnrollment(
              settingMode.type,
              'verified',
            )
            clientLogger.info('end reset enroll')
            if (!success) {
              setError(message)
              return
            }
            const {
              success: listSuccess,
              data: listData,
              error: listError,
            } = await listMfa()
            if (!listSuccess) {
              clientLogger.error('Failed to list MFA', new Error(listError), {
                error: listError,
              })
              setError(listError)
              return
            }
            setState(listData)
            setError(null)
            setSettingMode(null)
            showSnackbar(UI_MESSAGES.TOTP_RESET_SUCCESS, 'success')
          }}
          title='TOTP設定を無効にする'
          message={`TOTPの設定を削除しますが、本当によろしいですか？`}
          confirmLabel='無効にする'
          cancelLabel='キャンセル'
          variant='danger'
        />
      </>
    )
  }

  if (
    settingMode &&
    mfaData?.type === MFA_TYPES.TOTP &&
    settingMode.type === MFA_TYPES.TOTP &&
    settingMode.mode === 'update'
  ) {
    // TOTP有効にする場合
    return (
      <TotpSetup
        factorId={mfaData.data.factorId}
        qrCode={mfaData.data.qrCode}
        onComplete={async () => {
          const {
            success: listSuccess,
            data: listData,
            error: listError,
          } = await listMfa()
          if (!listSuccess) {
            setError(listError)
            return
          }
          setState(listData)
          setSettingMode(null)
          showSnackbar(UI_MESSAGES.TOTP_SETUP_SUCCESS)
        }}
        onBack={() => setSettingMode(null)}
      />
    )
  }

  return (
    <>
      {/* エラーメッセージ */}
      {error && (
        <div className='p-4 bg-red-100 border-2 border-red-500 text-red-700 rounded'>
          <button
            onClick={() => setError(null)}
            className='float-right text-red-500 hover:text-red-700'
          >
            ×
          </button>
          {error}
        </div>
      )}

      <TwoFactorAuthenticationMethodList items={methodItems} />
      <ReversalButton
        label='戻る'
        onClick={() => router.replace(PROTECTED_PATHS.PROFILE)}
        border
      />
    </>
  )
}

const isMethodEnabled = (factors: User['factors'], methodType: MfaType) => {
  if (!factors || factors.length === 0) return false
  return factors.some(
    (factor) => factor.factor_type === methodType && factor.status === 'verified',
  )
}

type SettingMode = {
  type: MfaType
  mode: 'update' | 'delete'
}

type MfaData =
  | {
      type: typeof MFA_TYPES.TOTP
      data: TotpMFaData
    }
  | {
      type: typeof MFA_TYPES.SMS
      data: null
    }

type TotpMFaData = {
  factorId: string
  qrCode: string
}
