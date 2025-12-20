'use client'

import { MFA_TYPES } from '@/lib/supabase/auth/types'
import QrCodeDisplay from '@/components/elements/qr-code-display/QrCodeDisplay'
import { Spacer } from '@/components/elements/spacer/Spacer'
import { resetEnrollment } from '@/lib/supabase/auth/client/mfa'
import ReversalButton from '@/components/elements/reversal-button/ReversalButton'
import MfaVerificationInput from './MfaVerificationInput'

type TotpSetupProps = {
  factorId: string
  qrCode: string
  onComplete: () => void
  onBack?: () => void
}

export default function TotpSetup({
  factorId,
  qrCode,
  onComplete,
  onBack,
}: TotpSetupProps) {
  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📱</div>
      <h2>TOTP アプリの設定</h2>

      {/* QRコードセクション */}
      <QrCodeDisplay qrCodeSvg={qrCode} />

      {/* 認証コード入力セクション */}
      <MfaVerificationInput
        selectedMFA={{ id: factorId, type: MFA_TYPES.TOTP }}
        onVerifyComplete={onComplete}
      />

      {/* ヒントセクション */}
      <div
        style={{
          marginTop: '1rem',
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
      <Spacer size={20} />
      <ReversalButton
        label='キャンセル'
        onClick={async () => {
          // TOTPエンロールをリセット
          const { success } = await resetEnrollment(MFA_TYPES.TOTP, 'unverified')
          if (!success) {
            // TODO エラー処理
          }

          if (onBack) {
            onBack()
          }
        }}
        border
      />
    </div>
  )
}
