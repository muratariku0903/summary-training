import TwoFactorAuthenticationSetting from '../components/TwoFactorAuthenticationSetting'
import { getUserProfile } from '../../../lib/features/user'
import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'

export default async function TwoFactorAuthenticationPage() {
  // SSRでユーザー情報を取得
  const { user } = await getUserProfile()

  return (
    <>
      <Header menuType='member' />
      <Main>
        <div className='max-w-2xl mx-auto p-6 space-y-6'>
          <div>
            <h2 className='text-2xl font-bold mb-2'>二段階認証</h2>
            <p className='text-gray-600'>
              アカウントのセキュリティを強化するため、二段階認証を設定してください。
            </p>
          </div>
          <TwoFactorAuthenticationSetting factors={user.factors} />
        </div>
      </Main>
      <Footer />
    </>
  )
}
