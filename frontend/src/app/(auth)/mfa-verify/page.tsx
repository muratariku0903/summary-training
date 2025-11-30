import Header from '@/components/layouts/header/Header'
import { getUserProfile } from '../../../lib/features/user/server'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'
import MfaSwitcher from '@/components/features/auth/MfaSwitcher'
import { convertMfaFactors } from '@/lib/supabase/auth/mfa'

export default async function MfaVerifyPage() {
  // SSRでユーザー情報を取得
  const { user } = await getUserProfile()

  const mfaFactors = convertMfaFactors({
    all: [],
    totp: user.factors?.filter((f) => f.factor_type === 'totp') ?? [],
    phone: user.factors?.filter((f) => f.factor_type === 'phone') ?? [],
  })

  return (
    <>
      <Header />
      <Main>
        <div>
          <div style={{ maxWidth: 500, margin: '1rem auto', textAlign: 'center' }}>
            <h2>追加認証が必要です</h2>
            <p>
              このアカウントは二段階認証が設定されているため、
              <br />
              セキュリティ確保のため認証アプリのコードを入力してください。
            </p>
          </div>
          <MfaSwitcher
            initSelectedMFA={mfaFactors.length === 1 ? mfaFactors[0] : null}
            selectableMFAList={mfaFactors}
          />
        </div>
      </Main>
      <Footer />
    </>
  )
}
