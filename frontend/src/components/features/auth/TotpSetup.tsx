'use client'

import MfaVerification from './MfaVerification'
import { MFA_TYPES } from '@/lib/constants/auth'
import QrCodeDisplay from '@/components/elements/qr-code-display/QrCodeDisplay'
import { Spacer } from '@/components/elements/spacer/Spacer'

type TotpSetupProps = {
  factorId: string
  qrCode: string
  onBack?: () => void
  onComplete?: () => void
}

export default function TotpSetup({ factorId, qrCode, onBack }: TotpSetupProps) {
  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📱</div>
      <h2>TOTP アプリの設定</h2>

      {/* QRコードセクション */}
      <QrCodeDisplay qrCodeSvg={qrCode} />

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
      <Spacer size={10} />
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
}
