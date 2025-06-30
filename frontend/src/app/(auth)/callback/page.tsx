'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { browserClient as supabaseBrowserClient } from '@/lib/supabase/browserClient'
import Header, { HeaderMenuType } from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'
import { PROTECTED_PATHS } from '@/lib/constants/routes'
import { enrollTotpFactor, verifyTotp } from '@/lib/supabase/auth/mfa'

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
 * 4. User’s view:
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

  const [factorId, setFactorId] = useState<string | null>(null)
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null)
  const [code, setCode] = useState<string>('')

  useEffect(() => {
    const handleCallback = async () => {
      // TOTP設定開始
      // この画面に遷移した段階で既に認証情報がブラウザに保存されている前提
      const { success, factorId, qrCode, message } = await enrollTotpFactor()
      if (!success) {
        console.error(message)
        return
      }

      setFactorId(factorId)
      setQrCodeSvg(qrCode) // SVG 形式の QR
    }

    handleCallback()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!factorId) return

    // TOTP設定完了
    const { success, message, verify_data } = await verifyTotp({
      factorId,
      totpCode: code,
    })
    if (!success) {
      console.error(message)
      return
    }

    // セッションを上書き（AAL2 JWT を取得）
    await supabaseBrowserClient.auth.setSession({
      access_token: verify_data.access_token,
      refresh_token: verify_data.refresh_token,
    })

    // 完了後、ダッシュボードなどへリダイレクト
    router.replace(PROTECTED_PATHS.DASHBOARD)
  }

  return (
    <>
      <Header menuType={HeaderMenuType.HIDDEN} />
      <Main>
        <div style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'center' }}>
          {!qrCodeSvg && <p>認証処理中…</p>}

          {qrCodeSvg && (
            <>
              <p>
                ① 下の QR をお手持ちの TOTP アプリ（Google Authenticator
                など）で読み込んでください。
              </p>
              <div
                // Supabase から返ってくる SVG をそのまま埋め込み
                dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
              />
              {/* UIをもっとわかりやすくしたい */}
              <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                <label htmlFor='code'>② アプリに表示された 6 桁のコードを入力：</label>
                <input
                  id='code'
                  type='text'
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  pattern='\d{6}'
                  required
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem',
                    margin: '0.5rem 0',
                  }}
                />
                <button type='submit' style={{ padding: '0.5rem 1rem' }}>
                  登録して完了
                </button>
              </form>
            </>
          )}
        </div>
      </Main>
      <Footer />
    </>
  )
}
