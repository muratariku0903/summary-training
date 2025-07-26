'use client'

import ReversalButton from '@/components/elements/reversal-button/ReversalButton'
import Footer from '@/components/layouts/footer/Footer'
import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import { PUBLIC_PATHS } from '@/lib/constants/routes'
import DescopeAuthProviders from '@/providers/descope/auth'
import { Descope, getSessionToken } from '@descope/react-sdk'
import { useRouter } from 'next/navigation'

export default function PasskeyPage() {
  const router = useRouter()

  const handleSuccess = async () => {
    const idpToken = getSessionToken() // DescopeのセッションJWT
    if (!idpToken) return alert('No session token')

    console.log(idpToken)
    // const res = await fetch('/api/idp/callback', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   credentials: 'include', // ← HttpOnlyクッキーを受け取る
    //   body: JSON.stringify({ idpToken }),
    // })

    // if (res.status === 409) {
    //   // メール未登録/未検証など → あなたのオンボーディングへ
    //   // router.push('/onboarding/verify-email')
    //   return
    // }
    // if (!res.ok) {
    //   const t = await res.text()
    //   console.error(t)
    //   return alert('Sign-in failed')
    // }

    // 成功：サーバーがSupabase互換JWTをHttpOnlyクッキーにセット済み
    // router.replace('/dashboard')
  }

  return (
    <>
      <Header />
      <Main>
        <div>
          <DescopeAuthProviders>
            <Descope
              flowId='sign-up-or-in'
              theme='light'
              onSuccess={handleSuccess}
              onError={(e) => console.error('Descope error', e)}
            />
          </DescopeAuthProviders>
          <div>
            <ReversalButton
              label='戻る'
              onClick={() => router.replace(PUBLIC_PATHS.SIGNIN)}
              border
            />
          </div>
        </div>
      </Main>
      <Footer />
    </>
  )
}
