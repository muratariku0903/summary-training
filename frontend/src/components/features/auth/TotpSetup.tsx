'use client'

import { useState, useEffect } from 'react'
import { enrollTotpFactor } from '@/lib/supabase/auth/mfa'
import MfaVerification from './MfaVerification'
import { MFA_TYPES } from '@/lib/constants/auth'
import QrCodeDisplay from '@/components/elements/qr-code-display/QrCodeDisplay'

type TotpSetupProps = {
  onBack?: () => void
  onComplete?: () => void
}

export default function TotpSetup({ onBack }: TotpSetupProps) {
  const [state, setState] = useState<TotpSetupState>({
    qrCodeSvg: null,
    factorId: null,
    error: null,
    step: TOTP_SETUP_STEPS.LOADING,
  })

  // コンポーネントマウント時にTOTP設定を開始
  useEffect(() => {
    const initializeTotp = async () => {
      try {
        const { success, factorId, qrCode, message } = await enrollTotpFactor()

        if (!success) {
          setState(() => ({
            qrCodeSvg: null,
            factorId: null,
            error: message,
            step: TOTP_SETUP_STEPS.ERROR,
          }))
          return
        }

        setState(() => ({
          factorId,
          qrCodeSvg: qrCode,
          error: null,
          step: TOTP_SETUP_STEPS.SETUP,
        }))
      } catch (error) {
        console.error(error)
        setState(() => ({
          qrCodeSvg: null,
          factorId: null,
          error: 'TOTP設定の初期化中にエラーが発生しました',
          step: TOTP_SETUP_STEPS.ERROR,
        }))
      }
    }

    initializeTotp()
  }, [])

  // ローディング画面
  const renderLoading = () => (
    <div style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
      <h2>TOTP設定を準備中...</h2>
      <p style={{ color: '#666' }}>QRコードを生成しています。しばらくお待ちください。</p>
    </div>
  )

  // エラー画面
  const renderError = () => (
    <div style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
      <h2>エラーが発生しました</h2>
      <p style={{ color: '#dc3545', margin: '1rem 0' }}>{state.error}</p>
      <button
        onClick={onBack}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        戻る
      </button>
    </div>
  )

  // QRコード表示画面
  const renderSetup = (factorId: string) => (
    <div style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📱</div>
      <h2>TOTP アプリの設定</h2>

      {/* QRコードセクション */}
      <QrCodeDisplay qrCodeSvg={state.qrCodeSvg} />

      {/* 認証コード入力セクション */}
      <MfaVerification selectedMFA={{ id: factorId, type: MFA_TYPES.TOTP }} />

      {/* ヒントセクション */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#e9ecef',
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: '#495057',
        }}
      >
        <strong>💡 ヒント:</strong>
        <ul style={{ textAlign: 'left', marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>QRコードが読み取れない場合は、画面の明度を上げてみてください</li>
          <li>コードは30秒ごとに変更されます</li>
          <li>入力したコードが無効な場合は、新しいコードをお試しください</li>
        </ul>
      </div>
    </div>
  )

  // ステップに応じて表示内容を切り替え
  switch (state.step) {
    case TOTP_SETUP_STEPS.LOADING:
      return renderLoading()
    case TOTP_SETUP_STEPS.ERROR:
      return renderError()
    case TOTP_SETUP_STEPS.SETUP:
      return renderSetup(state.factorId)
    default:
      return renderLoading()
  }
}

const TOTP_SETUP_STEPS = {
  LOADING: 'loading',
  SETUP: 'setup',
  ERROR: 'error',
} as const

type TotpSetupState =
  | {
      step: typeof TOTP_SETUP_STEPS.LOADING
      qrCodeSvg: null
      factorId: null
      error: null
    }
  | {
      step: typeof TOTP_SETUP_STEPS.SETUP
      qrCodeSvg: string
      factorId: string
      error: null
    }
  | {
      step: typeof TOTP_SETUP_STEPS.ERROR
      qrCodeSvg: null
      factorId: null
      error: string
    }
