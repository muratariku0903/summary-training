'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Header, { HeaderMenuType } from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'
import { PROTECTED_PATHS } from '@/lib/constants/routes'
import { MfaType } from '@/lib/supabase/auth/types'
import { MFA_TYPES } from '@/lib/constants/auth'
import TotpSetup from '@/components/features/auth/TotpSetup'
import { enrollTotpFactor } from '@/lib/supabase/auth/mfa'

// この画面はSupabaseからの確認メールのリンクを押下した際に遷移
/**
 * EMAIL-LINK → SESSION FLOW (Supabase + PKCE)
 *
 * 1. Email link clicked:
 *    /auth/v1/verify?...&redirect_to=/callback
 *    → GoTrue verifies token
 *    → 303 redirect to /callback?code=XXXX&state=YYYY
 *
 * 2. /callback loads:
 *    Supabase JS SDK (flowType:'pkce', detectSessionInUrl:true)
 *    automatically calls exchangeCodeForSession(code).
 *
 * 3. Token storage:
 *    access_token / refresh_token saved to Cookies
 *    then history.replaceState() removes ?code from URL.
 *
 * 4. User's view:
 *    Page shows plain /callback and user is already logged-in.
 *
 * 5. To disable auto-exchange:
 *    createClient(url, anonKey, {
 *      auth: { flowType: 'pkce', detectSessionInUrl: false }
 *    });
 *    // then call supabase.auth.exchangeCodeForSession(code) manually.
 */

export default function CallbackPage() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<{ mfaType: MfaType }>({ mode: 'onChange' })

  const [setupMfa, setSetupMfa] = useState<SetupMfa>(SETUP_MFA.UNSELECTED)
  const [selectedMfaType, setSelectedMfaType] = useState<MfaType | null>(null)
  const [mfaData, setMfaData] = useState<MfaData | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const onSubmit = async (input: { mfaType: MfaType }) => {
    const mfaType = input.mfaType

    if (mfaType === MFA_TYPES.TOTP) {
      const { success, factorId, qrCode, message } = await enrollTotpFactor()
      if (!success) {
        setError({ message })

        return
      }

      setMfaData({
        type: mfaType,
        data: { factorId, qrCode },
      })
    }

    setSelectedMfaType(input.mfaType)
  }

  const renderContent = () => {
    //　2段階認証を設定するか選択してもらう
    if (setupMfa === SETUP_MFA.UNSELECTED) {
      return (
        <div style={{ maxWidth: 500, margin: '2rem auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2>会員登録が完了しました！</h2>
          <p style={{ margin: '1.5rem 0', fontSize: '1.1rem', lineHeight: '1.6' }}>
            ご登録いただき、ありがとうございます。
            <br />
            メールアドレスの確認が完了し、アカウントが有効になりました。
          </p>

          <div
            style={{
              margin: '2rem 0',
              padding: '1.5rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🔐</div>
            <h3 style={{ marginBottom: '1rem' }}>セキュリティ設定</h3>
            <p
              style={{
                fontSize: '0.95rem',
                lineHeight: '1.5',
                color: '#666',
                marginBottom: '1rem',
              }}
            >
              アカウントのセキュリティを向上させるために、
              <br />
              2段階認証の設定をお勧めします。
            </p>
            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1.5rem' }}>
              ※ 後からアカウント設定で変更・設定することも可能です
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => setSetupMfa(SETUP_MFA.YES)}
                style={{
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.95rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                2段階認証を設定する（推奨）
              </button>

              <button
                onClick={() => router.replace(PROTECTED_PATHS.DASHBOARD)}
                style={{
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.95rem',
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                今はスキップして始める
              </button>
            </div>
          </div>
        </div>
      )
    }

    // 2段階認証の設定をする場合、検証方式を選択させる
    if (setupMfa === SETUP_MFA.YES && !selectedMfaType) {
      return (
        <div style={{ maxWidth: 500, margin: '2rem auto', textAlign: 'center' }}>
          <h2>2段階認証の方法を選択</h2>
          <p style={{ margin: '1.5rem 0', color: '#666' }}>
            どの方法で2段階認証を設定しますか？
          </p>
          <form onSubmit={handleSubmit(onSubmit)} style={{ margin: '2rem 0' }}>
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label
                htmlFor='mfaMethod'
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
              >
                認証方法を選択してください:
              </label>
              <select
                id='mfaMethod'
                {...register('mfaType', {
                  required: '認証方法を選択してください',
                })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: errors.mfaType ? '2px solid #dc3545' : '2px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value=''>選択してください</option>
                <option value={MFA_TYPES.TOTP}>
                  TOTP アプリ（Google Authenticator、Authy など）
                </option>
                <option value={MFA_TYPES.EMAIL} disabled>
                  メール認証（近日対応予定）
                </option>
                <option value={MFA_TYPES.SMS} disabled>
                  SMS認証（近日対応予定）
                </option>
              </select>
              {errors.mfaType && (
                <span
                  style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}
                >
                  {errors.mfaType.message}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                type='submit'
                disabled={!isValid}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  backgroundColor: isValid ? '#007bff' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isValid ? 'pointer' : 'not-allowed',
                }}
              >
                次へ
              </button>

              <button
                type='button'
                onClick={() => setSetupMfa(SETUP_MFA.UNSELECTED)}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                戻る
              </button>
            </div>
          </form>
          {error && <div>{error.message}</div>}
        </div>
      )
    }

    if (selectedMfaType && mfaData) {
      if (selectedMfaType === MFA_TYPES.TOTP) {
        return (
          <TotpSetup
            factorId={mfaData.data.factorId}
            qrCode={mfaData.data.qrCode}
            onBack={() => setSetupMfa(SETUP_MFA.UNSELECTED)}
          />
        )
      }

      return <h1>hello world</h1>
    }
  }

  return (
    <>
      <Header menuType={HeaderMenuType.HIDDEN} />
      <Main>{renderContent()}</Main>
      <Footer />
    </>
  )
}

const SETUP_MFA = {
  UNSELECTED: 'UNSELECTED',
  YES: 'YES',
  NO: 'NO',
} as const
type SetupMfa = (typeof SETUP_MFA)[keyof typeof SETUP_MFA]

type MfaData = {
  type: MfaType
  data: TotpMFaData
}

type TotpMFaData = {
  factorId: string
  qrCode: string
}

type Error = {
  message: string
}
