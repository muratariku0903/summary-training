'use client'

import DOMPurify from 'dompurify'

type QrCodeDisplayProps = {
  qrCodeSvg: string | null
  title?: string
  description?: string
  isLoading?: boolean
}

export default function QrCodeDisplay({
  qrCodeSvg,
  title = 'QRコードをスキャン',
  description = 'お手持ちのTOTPアプリ（Google Authenticator、Authy など）で下のQRコードを読み込んでください。',
  isLoading = false,
}: QrCodeDisplayProps) {
  return (
    <div
      style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '12px',
        margin: '1.5rem 0',
      }}
    >
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{title}</h3>
      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
        {description}
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          margin: '1rem 0',
          padding: '1rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}
      >
        {qrCodeSvg && !isLoading ? (
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(qrCodeSvg) }} />
        ) : (
          <div
            style={{
              padding: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              color: '#666',
            }}
          >
            {isLoading ? (
              <>
                <span style={{ marginRight: '0.5rem' }}>⏳</span>
                QRコードを読み込み中...
              </>
            ) : (
              <>
                <span style={{ marginRight: '0.5rem' }}>❌</span>
                QRコードの読み込みに失敗しました
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
