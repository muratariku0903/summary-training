'use client'

import Header from '@/components/layouts/header/Header'
import Footer from '@/components/layouts/footer/Footer'
import Main from '@/components/layouts/main/Main'
import { HeaderMenuType } from '@/components/layouts/header/Header'

import { User } from '@supabase/supabase-js'
import { MfaType } from '@/lib/supabase/auth/types'
import TwoFactorAuthenticationMethodList, {
  AuthenticationMethodItem,
} from './TwoFactorAuthenticationMethodList'
import { MFA_TYPES } from '@/lib/constants/auth'

type TwoFactorAuthenticationSettingProps = {
  user: User
}

export default function TwoFactorAuthenticationSetting({
  user,
}: TwoFactorAuthenticationSettingProps) {
  const items: AuthenticationMethodItem[] = [
    {
      type: MFA_TYPES.TOTP,
      name: 'TOTP認証',
      desc: '認証アプリを使用した時間ベースのワンタイムパスワード',
      enable: isMethodEnabled(user, MFA_TYPES.TOTP),
      onClickSetting: () => console.log(''),
      onClickReset: () => console.log(''),
    },
    {
      type: MFA_TYPES.SMS,
      name: 'SMS認証',
      desc: 'SMS経由でのワンタイムパスワード',
      enable: isMethodEnabled(user, MFA_TYPES.SMS),
      onClickSetting: () => console.log(''),
      onClickReset: () => console.log(''),
    },
  ]

  return (
    <>
      <Header menuType={HeaderMenuType.MEMBER} />
      <Main>
        <div className='max-w-2xl mx-auto p-6 space-y-6'>
          <div>
            <h2 className='text-2xl font-bold mb-2'>二段階認証</h2>
            <p className='text-gray-600'>
              アカウントのセキュリティを強化するため、二段階認証を設定してください。
            </p>
          </div>
          <TwoFactorAuthenticationMethodList items={items} />
        </div>
      </Main>
      <Footer />
    </>
  )
}

const isMethodEnabled = (user: User, methodType: MfaType) => {
  if (!user.factors || user.factors.length === 0) return false
  return user.factors.some((factor) => factor.factor_type === methodType)
}
