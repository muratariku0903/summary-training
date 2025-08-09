'use client'

import Footer from '@/components/layouts/footer/Footer'
import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import { request } from '@/lib/api/client'
import { PROTECTED_PATHS } from '@/lib/constants/routes'
import { UI_MESSAGES } from '@/lib/constants/ui'
import DescopeAuthProviders from '@/providers/descope/auth'
import { useSnackbarStore } from '@/stores/useSnackbarStore'
import { getSessionToken } from '@descope/react-sdk'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

// SSR をオフにしてクライアントでのみ読み込む
const Descope = dynamic(() => import('@descope/react-sdk').then((mod) => mod.Descope), {
  ssr: false,
})

export default function PasskeyPage() {
  const router = useRouter()
  const showSnackbar = useSnackbarStore((s) => s.show)

  const handleSuccess = async () => {
    const idpToken = getSessionToken() // DescopeのセッションJWT
    if (!idpToken) return alert('No session token')

    const { success, error } = await request('/idp/callback', 'post', { idpToken })
    if (!success) {
      // TODO: 409の対応

      console.error(error)
      return
    }

    // 成功：サーバーがSupabase互換JWTをHttpOnlyクッキーにセット済み
    showSnackbar(UI_MESSAGES.SIGNIN_SUCCESS_MESSAGE, 'success')
    router.replace(PROTECTED_PATHS.DASHBOARD)
  }

  return (
    <>
      <Header />
      <Main>
        <DescopeAuthProviders>
          <Descope flowId='sign-up-or-in' theme='light' onSuccess={handleSuccess} />
        </DescopeAuthProviders>
      </Main>
      <Footer />
    </>
  )
}
